import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

// Every action re-checks the role. RLS (public.is_admin()) enforces it again in the database.
async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");
  return { supabase, adminId: auth.user.id };
}

async function setPlan(formData: FormData) {
  "use server";
  const { supabase } = await requireAdmin();
  const plan = String(formData.get("plan"));
  if (!["free", "pro", "growth"].includes(plan)) return;
  await supabase.from("profiles").update({ plan }).eq("id", String(formData.get("id")));
  revalidatePath("/admin");
}

async function setStatus(formData: FormData) {
  "use server";
  const { supabase, adminId } = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === adminId) return; // don't lock yourself out
  const status = formData.get("status") === "active" ? "suspended" : "active";
  await supabase.from("profiles").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

type UserRow = {
  id: string; email: string; full_name: string | null; role: string; plan: string; status: string; created_at: string;
  last_sign_in_at: string | null; ig_accounts: number; automations: number;
  dms_sent: number; dms_failed: number; leads: number;
};

const LIMITS: Record<string, number> = { free: 500, pro: 5000, growth: 20000 };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : "never");

export default async function Admin() {
  const { supabase } = await requireAdmin();

  const [users, events] = await Promise.all([
    supabase.rpc("admin_user_overview"),
    supabase.from("dm_events").select("user_id, status, error, created_at, media_id").order("created_at", { ascending: false }).limit(30),
  ]);
  const rows = (users.data ?? []) as UserRow[];
  const emailOf = new Map(rows.map((u) => [u.id, u.email]));
  const sum = (k: "dms_sent" | "leads") => rows.reduce((n, u) => n + Number(u[k]), 0);
  const byPlan = (p: string) => rows.filter((u) => u.plan === p).length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 bg-neutral-950 px-5 py-8 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <a href="/dashboard" className="text-sm text-fuchsia-400">My dashboard &rarr;</a>
      </header>
      {users.error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{users.error.message}</p>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Users", rows.length],
          ["Free / Pro / Growth", `${byPlan("free")} / ${byPlan("pro")} / ${byPlan("growth")}`],
          ["Suspended", rows.filter((u) => u.status === "suspended").length],
          ["DMs sent", sum("dms_sent")],
          ["Leads", sum("leads")],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-neutral-800 p-4">
            <p className="text-sm text-neutral-400">{l}</p>
            <p className="text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Users and subscriptions</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-neutral-800 text-neutral-400">
              <tr>
                {["User", "Plan", "Usage", "IG", "Autos", "Failed", "Leads", "Last login", "Status", ""].map((h) => (
                  <th key={h} className="p-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">
                    {u.full_name && <div className="font-medium">{u.full_name}</div>}
                    {u.email} {u.role === "admin" && <span className="ml-1 rounded bg-fuchsia-950 px-1.5 text-xs text-fuchsia-300">admin</span>}
                    <div className="text-xs text-neutral-500">joined {fmt(u.created_at)}</div>
                  </td>
                  <td className="p-3">
                    <form action={setPlan} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="plan" defaultValue={u.plan} className="rounded bg-neutral-900 p-1">
                        <option>free</option>
                        <option>pro</option>
                        <option>growth</option>
                      </select>
                      <button className="rounded border border-neutral-700 px-2">Save</button>
                    </form>
                  </td>
                  <td className="p-3">{Number(u.dms_sent)} / {LIMITS[u.plan]}</td>
                  <td className="p-3">{Number(u.ig_accounts)}</td>
                  <td className="p-3">{Number(u.automations)}</td>
                  <td className="p-3">{Number(u.dms_failed)}</td>
                  <td className="p-3">{Number(u.leads)}</td>
                  <td className="p-3 text-neutral-400">{fmt(u.last_sign_in_at)}</td>
                  <td className="p-3">
                    <span className={u.status === "active" ? "text-green-400" : "text-red-400"}>{u.status}</span>
                  </td>
                  <td className="p-3">
                    {u.role !== "admin" && (
                      <form action={setStatus}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="status" value={u.status} />
                        <button className="rounded border border-neutral-700 px-2 py-1">
                          {u.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 text-sm">
          {events.data?.map((e, i) => (
            <div key={i} className="flex justify-between gap-4 p-3">
              <span>{emailOf.get(e.user_id) ?? e.user_id}</span>
              <span className={e.status === "sent" ? "text-green-400" : e.status === "failed" ? "text-red-400" : "text-yellow-400"}>
                {e.status}{e.error ? `: ${e.error.slice(0, 60)}` : ""}
              </span>
              <span className="text-neutral-500">{fmt(e.created_at)}</span>
            </div>
          ))}
          {!events.data?.length && <p className="p-3 text-neutral-500">No DM activity yet.</p>}
        </div>
      </section>
    </main>
  );
}
