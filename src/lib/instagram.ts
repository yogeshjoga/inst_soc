import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.instagram.com/v23.0";

export const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
].join(",");

export const redirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;

export function verifySignature(rawBody: string, header: string | null) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", process.env.META_APP_SECRET!).update(rawBody).digest("hex");
  const given = header.slice(7);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Meta allows exactly one private reply per comment, within 7 days. */
export async function sendPrivateReply(igUserId: string, token: string, commentId: string, text: string) {
  const res = await fetch(`${GRAPH}/${igUserId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } }),
  });
  if (!res.ok) throw new Error(`DM failed ${res.status}: ${await res.text()}`);
}

export async function sendPublicReply(token: string, commentId: string, text: string) {
  const res = await fetch(`${GRAPH}/${commentId}/replies`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) throw new Error(`Reply failed ${res.status}: ${await res.text()}`);
}

export const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function matches(text: string, keywords: string[], anyWord: boolean) {
  if (anyWord) return keywords[0] ?? "any";
  const t = text.toLowerCase();
  return keywords.find((k) => k && t.includes(k.toLowerCase())) ?? null;
}
