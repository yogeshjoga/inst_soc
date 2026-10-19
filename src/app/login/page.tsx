import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function login(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 bg-neutral-950 px-5 text-neutral-100">
      <h1 className="text-2xl font-semibold">Log in to Loopline</h1>
      {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p className="rounded-lg bg-green-950 p-3 text-sm text-green-300">{notice}</p>}
      <form action={login} className="flex flex-col gap-3">
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg bg-neutral-900 p-3" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="rounded-lg bg-neutral-900 p-3" />
        <button className="rounded-lg bg-fuchsia-500 p-3 font-medium">Log in</button>
      </form>
      <p className="text-center text-sm text-neutral-400">
        New here? <a href="/signup" className="text-fuchsia-400">Create an account</a>
      </p>
    </main>
  );
}
