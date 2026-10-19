import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { pollComments } from "@/lib/comments";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

// Call every minute from any cron service: GET with header "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  return Response.json(await pollComments());
}
