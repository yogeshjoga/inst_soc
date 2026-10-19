import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const lines = (s: FormDataEntryValue | null) =>
  String(s ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

async function createAutomation(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 20);
  const dm = lines(formData.get("dm"));
  const anyWord = formData.get("any_word") === "on";
  if (!dm.length || (!anyWord && !keywords.length)) return;

  // RLS: account must belong to the user, otherwise the insert's FK lookup finds nothing
  const { data: account } = await supabase.from("ig_accounts").select("id").eq("id", String(formData.get("account"))).single();
  if (!account) return;

  await supabase.from("automations").insert({
    user_id: auth.user.id,
    ig_account_id: account.id,
    name: String(formData.get("name") || keywords[0] || "Any word"),
    keywords,
    any_word: anyWord,
    media_id: String(formData.get("media_id") || "") || null,
    dm_variations: dm,
    public_replies: lines(formData.get("replies")),
    link_url: String(formData.get("link") || "") || null,
  });
  revalidatePath("/dashboard");
}

async function toggle(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("automations")
    .update({ active: formData.get("active") !== "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}

async function remove(formData: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("automations").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}

const input = "w-full rounded-lg bg-neutral-900 p-2.5 text-sm";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const [accounts, automations, leads, events] = await Promise.all([
    supabase.from("ig_accounts").select("id, username"),
    supabase.from("automations").select("*").order("created_at", { ascending: false }),
    supabase.from("leads").select("username, keyword, media_id, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("dm_events").select("status"),
  ]);
  const sent = events.data?.filter((e) => e.status === "sent").length ?? 0;
  const failed = events.data?.filter((e) => e.status === "failed").length ?? 0;

  return (
    <main className="mx-auto max-w-4xl space-y-8 bg-neutral-950 px-5 py-8 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <a href="/api/instagram/connect" className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-medium">
          {accounts.data?.length ? "Reconnect Instagram" : "Connect Instagram"}
        </a>
      </header>

      {sp.error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">Instagram connect failed: {sp.error}</p>}
      {sp.connected && <p className="rounded-lg bg-green-950 p-3 text-sm text-green-300">Instagram connected.</p>}

      <section className="grid grid-cols-3 gap-3">
        {[["DMs sent", sent], ["Failed", failed], ["Leads", leads.data?.length ?? 0]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-neutral-800 p-4">
            <p className="text-sm text-neutral-400">{l}</p>
            <p className="text-3xl font-semibold">{v}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">New automation</h2>
        {accounts.data?.length ? (
          <form action={createAutomation} className="grid gap-3 rounded-xl border border-neutral-800 p-4 md:grid-cols-2">
            <select name="account" className={input}>
              {accounts.data.map((a) => <option key={a.id} value={a.id}>@{a.username}</option>)}
            </select>
            <input name="name" placeholder="Name (optional)" className={input} />
            <input name="keywords" placeholder="Keywords, comma separated (max 20)" className={input} />
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input type="checkbox" name="any_word" /> Trigger on any comment
            </label>
            <input name="media_id" placeholder="Post/Reel media ID (blank = all posts)" className={input} />
            <input name="link" type="url" placeholder="Link to send" className={input} />
            <textarea name="dm" required rows={3} placeholder="DM text. One variation per line; one is picked at random." className={`${input} md:col-span-2`} />
            <textarea name="replies" rows={2} placeholder="Public replies (optional). One per line." className={`${input} md:col-span-2`} />
            <button className="rounded-lg bg-white p-2.5 text-sm font-medium text-black md:col-span-2">Create</button>
          </form>
        ) : (
          <p className="text-neutral-400">Connect an Instagram Business or Creator account first.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Automations</h2>
        {automations.data?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-neutral-800 p-4">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-neutral-400">
                {a.any_word ? "any comment" : a.keywords.join(", ")} · {a.media_id ? `post ${a.media_id}` : "all posts"} · {a.active ? "on" : "paused"}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={toggle}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="active" value={String(a.active)} />
                <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm">{a.active ? "Pause" : "Resume"}</button>
              </form>
              <form action={remove}>
                <input type="hidden" name="id" value={a.id} />
                <button className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {!automations.data?.length && <p className="text-neutral-500">None yet.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent leads</h2>
        <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 text-sm">
          {leads.data?.map((l, i) => (
            <div key={i} className="flex justify-between p-3">
              <span>@{l.username}</span>
              <span className="text-neutral-400">{l.keyword} · {new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
          {!leads.data?.length && <p className="p-3 text-neutral-500">No leads yet.</p>}
        </div>
      </section>
    </main>
  );
}
