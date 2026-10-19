import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdmin } from "@/lib/supabase/server";
import { redirectUri } from "@/lib/instagram";

const back = (q: string) => NextResponse.redirect(new URL(`/dashboard${q}`, process.env.NEXT_PUBLIC_APP_URL));

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const code = req.nextUrl.searchParams.get("code")?.replace(/#_$/, "");
  if (!code) return back("?error=instagram_denied");

  // 1. code -> short-lived token
  const short = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code,
    }),
  });
  if (!short.ok) return back("?error=token_exchange");
  const { access_token: shortToken } = await short.json();

  // 2. short -> long-lived (60 days)
  const long = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_APP_SECRET}&access_token=${shortToken}`,
  );
  if (!long.ok) return back("?error=long_token");
  const { access_token, expires_in } = await long.json();

  // 3. who is this
  const me = await fetch("https://graph.instagram.com/v23.0/me?fields=user_id,username", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!me.ok) return back("?error=profile");
  const { user_id, username } = await me.json();

  const admin = createAdmin();
  const { data: account, error } = await admin
    .from("ig_accounts")
    .upsert({ user_id: data.user.id, ig_user_id: String(user_id), username }, { onConflict: "ig_user_id" })
    .select("id")
    .single();
  if (error || !account) return back("?error=save");

  await admin.from("ig_tokens").upsert({
    ig_account_id: account.id,
    access_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  // 4. subscribe the account to comment webhooks
  await fetch(`https://graph.instagram.com/v23.0/${user_id}/subscribed_apps?subscribed_fields=comments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}` },
  });

  return back("?connected=1");
}
