import { after, type NextRequest } from "next/server";
import { createAdmin } from "@/lib/supabase/server";
import { matches, pick, sendPrivateReply, sendPublicReply, verifySignature } from "@/lib/instagram";

// Meta's subscription handshake
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge"), { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

const PLAN_DM_LIMIT: Record<string, number> = { free: 500, pro: 5000, growth: 20000 };

type CommentChange = {
  field: string;
  value: { id: string; text?: string; from?: { id: string; username?: string }; media?: { id: string } };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("bad signature", { status: 401 });
  }
  const body = JSON.parse(raw) as { entry?: { id: string; changes?: CommentChange[] }[] };

  // Ack fast; Meta retries on slow responses.
  after(async () => {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") continue;
        try {
          await handleComment(entry.id, change.value);
        } catch (e) {
          console.error("comment handler", e);
        }
      }
    }
  });
  return new Response("ok");
}

async function handleComment(igUserId: string, c: CommentChange["value"]) {
  if (!c.text || !c.from || c.from.id === igUserId) return; // ignore own comments

  const db = createAdmin();
  const { data: account } = await db
    .from("ig_accounts")
    .select("id, user_id, ig_tokens(access_token)")
    .eq("ig_user_id", igUserId)
    .single();
  const token = (account?.ig_tokens as unknown as { access_token: string } | null)?.access_token;
  if (!account || !token) return;

  const { data: profile } = await db.from("profiles").select("plan, status").eq("id", account.user_id).single();
  if (!profile || profile.status !== "active") return;

  const { data: automations } = await db
    .from("automations")
    .select("*")
    .eq("ig_account_id", account.id)
    .eq("active", true);

  const auto = automations?.find(
    (a) => (!a.media_id || a.media_id === c.media?.id) && matches(c.text!, a.keywords, a.any_word),
  );
  if (!auto) return;
  const keyword = matches(c.text, auto.keywords, auto.any_word);

  // Plan limit: DMs sent this calendar month.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await db
    .from("dm_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", account.user_id)
    .eq("status", "sent")
    .gte("created_at", monthStart.toISOString());
  const overLimit = (count ?? 0) >= (PLAN_DM_LIMIT[profile.plan] ?? 500);

  // Idempotency: the unique comment_id means a retried webhook can't double-send.
  const { error: dup } = await db
    .from("dm_events")
    .insert({
      user_id: account.user_id,
      automation_id: auto.id,
      comment_id: c.id,
      media_id: c.media?.id,
      ...(overLimit && { status: "skipped", error: "monthly DM limit reached" }),
    });
  if (dup || overLimit) return;

  try {
    const message = pick<string>(auto.dm_variations) + (auto.link_url ? `\n${auto.link_url}` : "");
    await sendPrivateReply(igUserId, token, c.id, message);
    if (auto.public_replies.length) {
      await sendPublicReply(token, c.id, pick<string>(auto.public_replies)).catch(() => {});
    }
    await db.from("dm_events").update({ status: "sent" }).eq("comment_id", c.id);
    await db.from("leads").insert({
      user_id: account.user_id,
      automation_id: auto.id,
      ig_scoped_id: c.from.id,
      username: c.from.username,
      media_id: c.media?.id,
      keyword,
    });
  } catch (e) {
    await db.from("dm_events").update({ status: "failed", error: String(e).slice(0, 500) }).eq("comment_id", c.id);
  }
}
