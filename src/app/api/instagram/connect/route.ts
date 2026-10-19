import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SCOPES, redirectUri } from "@/lib/instagram";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.redirect(new URL("/dashboard?error=meta_app_not_configured", process.env.NEXT_PUBLIC_APP_URL));
  }

  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  return NextResponse.redirect(url);
}
