import { createAdmin } from "@/lib/supabase/server";
import { matches, pick, sendPrivateReply, sendPublicReply } from "@/lib/instagram";

const GRAPH = "https://graph.instagram.com/v23.0";
const PLAN_DM_LIMIT: Record<string, number> = { free: 500, pro: 5000, growth: 20000 };
const REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // Meta: private replies only within 7 days

export type IncomingComment = {
  id: string;
  text?: string;
  from?: { id?: string; username?: string };
  media?: { id: string };
  /** ISO time of the comment; set by the poller so old comments never trigger a new automation. */
  commentedAt?: string;
};

export type Outcome = "sent" | "failed" | "limit" | "no_match" | "ignored" | "duplicate";

/** Shared by the webhook and the poller. One private reply per comment, enforced by dm_events.comment_id. */
export async function handleComment(igUserId: string, c: IncomingComment): Promise<Outcome> {
  if (!c.text) return "ignored";

  const db = createAdmin();
  const { data: account } = await db
    .from("ig_accounts")
    .select("id, user_id, username, ig_tokens(access_token)")
    .eq("ig_user_id", igUserId)
    .single();
  const token = (account?.ig_tokens as unknown as { access_token: string } | null)?.access_token;
  if (!account || !token) return "ignored";
  // Never answer the account's own comments.
  if (c.from?.id === igUserId || (c.from?.username && c.from.username === account.username)) return "ignored";

  const { data: profile } = await db.from("profiles").select("plan, status").eq("id", account.user_id).single();
  if (!profile || profile.status !== "active") return "ignored";

  const { data: automations } = await db
    .from("automations")
    .select("*")
    .eq("ig_account_id", account.id)
    .eq("active", true);

  const auto = automations?.find(
    (a) =>
      (!a.media_id || a.media_id === c.media?.id) &&
      matches(c.text!, a.keywords, a.any_word) &&
      // Poller only: a comment made before the automation existed must not trigger it.
      (!c.commentedAt || new Date(c.commentedAt) >= new Date(a.created_at)),
  );
  if (!auto) return "no_match";
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

  // Idempotency: the unique comment_id means a retried webhook or a repeated poll can't double-send.
  const { error: dup } = await db.from("dm_events").insert({
    user_id: account.user_id,
    automation_id: auto.id,
    comment_id: c.id,
    media_id: c.media?.id,
    ...(overLimit && { status: "skipped", error: "monthly DM limit reached" }),
  });
  if (dup) return "duplicate";
  if (overLimit) return "limit";

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
      ig_scoped_id: c.from?.id ?? null,
      username: c.from?.username,
      media_id: c.media?.id,
      keyword,
    });
    return "sent";
  } catch (e) {
    await db.from("dm_events").update({ status: "failed", error: String(e).slice(0, 500) }).eq("comment_id", c.id);
    return "failed";
  }
}

export type PollSummary = {
  accounts: number;
  media: number;
  comments: number;
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Fallback for when webhooks are not delivered (for example the Meta app is still unpublished):
 * read recent comments through the API and run them through the same handler.
 * Pass userId to limit it to one user's accounts.
 */
export async function pollComments(userId?: string): Promise<PollSummary> {
  const db = createAdmin();
  const summary: PollSummary = { accounts: 0, media: 0, comments: 0, sent: 0, failed: 0, errors: [] };

  let query = db.from("ig_accounts").select("ig_user_id, username, user_id, ig_tokens(access_token)");
  if (userId) query = query.eq("user_id", userId);
  const { data: accounts } = await query;

  for (const a of accounts ?? []) {
    const token = (a.ig_tokens as unknown as { access_token: string } | null)?.access_token;
    if (!token) continue;
    summary.accounts++;
    const get = async (url: string) => {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
      return r.json();
    };

    try {
      const media = await get(`${GRAPH}/${a.ig_user_id}/media?fields=id,timestamp&limit=10`);
      for (const m of (media.data ?? []) as { id: string }[]) {
        summary.media++;
        const comments = await get(`${GRAPH}/${m.id}/comments?fields=id,text,timestamp,username,from&limit=50`);
        for (const c of (comments.data ?? []) as {
          id: string; text?: string; timestamp?: string; username?: string; from?: { id?: string; username?: string };
        }[]) {
          summary.comments++;
          if (c.timestamp && Date.now() - new Date(c.timestamp).getTime() > REPLY_WINDOW_MS) continue;
          const outcome = await handleComment(a.ig_user_id, {
            id: c.id,
            text: c.text,
            from: { id: c.from?.id, username: c.from?.username ?? c.username },
            media: { id: m.id },
            commentedAt: c.timestamp,
          });
          if (outcome === "sent") summary.sent++;
          if (outcome === "failed") summary.failed++;
        }
      }
    } catch (e) {
      summary.errors.push(`@${a.username}: ${String(e).slice(0, 250)}`);
    }
  }
  return summary;
}
