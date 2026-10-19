import { after, type NextRequest } from "next/server";
import { createAdmin } from "@/lib/supabase/server";
import { verifySignature } from "@/lib/instagram";
import { handleComment, type IncomingComment } from "@/lib/comments";

// Meta's subscription handshake
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge"), { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

type CommentChange = {
  field: string;
  value: IncomingComment;
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signatureOk = verifySignature(raw, req.headers.get("x-hub-signature-256"));
  // Diagnostic trail of everything Meta sends us (service role only; prune periodically).
  await createAdmin()
    .from("webhook_log")
    .insert({ signature_ok: signatureOk, body: raw.slice(0, 4000) })
    .then(undefined, () => {});
  if (!signatureOk) {
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
