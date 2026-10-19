import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function signup(formData: FormData) {
  "use server";
  const fullName = String(formData.get("full_name")).trim();
  const email = String(formData.get("email")).trim();
  const password = String(formData.get("password"));
  const fail = (m: string) => redirect(`/signup?error=${encodeURIComponent(m)}`);

  if (fullName.length < 2) fail("Enter your full name.");
  if (password.length < 8) fail("Password must be at least 8 characters.");
  if (password !== String(formData.get("confirm"))) fail("Passwords do not match.");
  if (formData.get("terms") !== "on") fail("Please accept the terms to continue.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) fail(error.message);

  // Email confirmation on: signUp succeeds but returns no session yet.
  if (!data?.session) redirect("/login?notice=" + encodeURIComponent("Check your email to confirm your account, then log in."));
  redirect("/dashboard");
}

const field = "rounded-lg bg-neutral-900 p-3";

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 bg-neutral-950 px-5 py-10 text-neutral-100">
      <h1 className="text-2xl font-semibold">Create your Loopline account</h1>
      <p className="text-sm text-neutral-400">Free plan: 500 DMs a month. No card needed.</p>
      {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}
      <form action={signup} className="flex flex-col gap-3">
        <input name="full_name" required autoComplete="name" placeholder="Full name" className={field} />
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Password (8+ characters)" className={field} />
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" placeholder="Confirm password" className={field} />
        <label className="flex items-start gap-2 text-sm text-neutral-400">
          <input type="checkbox" name="terms" required className="mt-1" />
          I agree to the terms and privacy policy.
        </label>
        <button className="rounded-lg bg-fuchsia-500 p-3 font-medium">Create account</button>
      </form>
      <p className="text-center text-sm text-neutral-400">
        Already have an account? <a href="/login" className="text-fuchsia-400">Log in</a>
      </p>
    </main>
  );
}
