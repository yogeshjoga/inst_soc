import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function auth(formData: FormData) {
  "use server";
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const mode = String(formData.get("mode"));
  const supabase = await createClient();
  const { error } =
    mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 bg-neutral-950 px-5 text-neutral-100">
      <h1 className="text-2xl font-semibold">Log in to Loopline</h1>
      {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}
      <form action={auth} className="flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Email" className="rounded-lg bg-neutral-900 p-3" />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ chars)" className="rounded-lg bg-neutral-900 p-3" />
        <button name="mode" value="login" className="rounded-lg bg-fuchsia-500 p-3 font-medium">Log in</button>
        <button name="mode" value="signup" className="rounded-lg border border-neutral-700 p-3">Create account</button>
      </form>
    </main>
  );
}
