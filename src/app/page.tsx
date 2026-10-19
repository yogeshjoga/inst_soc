const modules = [
  {
    tag: "Funnel",
    title: "Comment → DM, on autopilot",
    body: "Up to 20 keywords per automation, target one Reel, the next post or everything. Optional public reply, follow or email gate, rotating DM variations.",
    replaces: "Manychat, CreatorFlow, LinkDM",
  },
  {
    tag: "Leads",
    title: "A CRM that is already filled in",
    body: "Every commenter becomes a contact with the post, keyword and gate answers attached. Tags, CSV export and webhooks to your email tool.",
    replaces: "Inro CRM, Manychat contacts",
  },
  {
    tag: "Studio",
    title: "Plan, write and schedule the next post",
    body: "Calendar and scheduler with AI hooks, captions and carousel copy built from your best-converting posts. The comment trigger is attached when you schedule.",
    replaces: "Buffer, Canva copy, caption tools",
  },
  {
    tag: "Insights",
    title: "See which post made the money",
    body: "Comments → DMs → clicks → leads per post, hook and keyword. Keyword and trend alerts tell you what to post before the spike peaks.",
    replaces: "Sprout reports, Brand24",
  },
];

const gaps = [
  ["Priced per contact or per AI message", "Flat price per workspace. No contact meter."],
  ["Sends stop silently at the DM cap", "You choose at the cap: queue, pay overage, or pause."],
  ["Four tools that never share data", "One loop: trend → draft → schedule → trigger → leads → what worked."],
  ["AI that is missing, or metered and overbuilt", "Templates by default. AI is an optional step with a template fallback."],
  ["Agents can't build your automations", "Full REST API and MCP server: create, edit, delete."],
  ["Link stats paywalled, stop at the click", "Per-post attribution to lead on every plan."],
  ["Failed or late DMs vanish", "Visible queue, retries and one-click replay."],
];

const steps = [
  ["Connect Instagram", "Business or Creator account, official Meta login."],
  ["Pick a post and a keyword", "Add a gate, an AI step or variations if you want them."],
  ["Comments become leads", "DMs go out, leads land in your CRM, stats update per post."],
];

const faq = [
  ["Is this allowed by Instagram?", "Yes. Loopline uses Meta's official Instagram API: one private reply per comment, sent within 7 days of the comment. We never ask for your password."],
  ["What happens after the first DM?", "Meta lets us send follow-ups only after the person replies (24-hour window). Gates and AI steps are designed around that."],
  ["Do I need to be a Business account?", "You need a Professional (Business or Creator) Instagram account."],
  ["Can my AI agent set up automations?", "Yes. The REST API and MCP server can create, edit and delete automations."],
];

export default function Home() {
  return (
    <main className="bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="#" className="text-lg font-semibold tracking-tight">
          Loop<span className="text-fuchsia-400">line</span>
        </a>
        <nav className="hidden gap-6 text-sm text-neutral-400 md:flex">
          <a href="#modules">Product</a>
          <a href="#gaps">Why us</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href="/signup" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
          Start free
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 inline-block rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">
            Funnel · Leads · Studio · Insights
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Comment → DM → lead → <span className="text-fuchsia-400">next post.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-neutral-400">
            One workspace that replaces your DM bot, CRM, scheduler and analytics tab. Flat price, no per-contact fees.
          </p>
          <div className="mt-8 flex gap-3">
            <a href="/signup" className="rounded-full bg-fuchsia-500 px-6 py-3 font-medium text-white">
              Start for free
            </a>
            <a href="#modules" className="rounded-full border border-neutral-700 px-6 py-3 font-medium">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-neutral-500">Free: 500 DMs/month, unlimited automations.</p>
        </div>

        <div className="mx-auto w-full max-w-xs rounded-[2rem] border border-neutral-800 bg-neutral-900 p-4">
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-neutral-800 p-3">
              <span className="text-neutral-400">@maya · </span>GUIDE 🙌
            </div>
            <div className="ml-auto w-5/6 rounded-2xl bg-fuchsia-500 p-3 text-white">
              Hey Maya! Here&apos;s the free guide: loopline.link/guide
            </div>
            <div className="rounded-2xl bg-neutral-800 p-3 text-neutral-300">Got it, thanks!</div>
            <p className="pt-2 text-center text-xs text-neutral-500">Lead saved · post: Reel #42 · keyword: GUIDE</p>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Four tools, one loop</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <div key={m.tag} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <span className="text-xs font-medium uppercase tracking-wider text-fuchsia-400">{m.tag}</span>
              <h3 className="mt-2 text-xl font-semibold">{m.title}</h3>
              <p className="mt-2 text-neutral-400">{m.body}</p>
              <p className="mt-4 text-xs text-neutral-500">Replaces: {m.replaces}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gaps" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">What the other tools get wrong</h2>
        <div className="mt-8 divide-y divide-neutral-800 rounded-2xl border border-neutral-800">
          {gaps.map(([bad, good]) => (
            <div key={bad} className="grid gap-2 p-5 md:grid-cols-2">
              <p className="text-neutral-500 line-through decoration-neutral-700">{bad}</p>
              <p>{good}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Live in under 2 minutes</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-neutral-800 p-6">
              <span className="text-fuchsia-400">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-1 text-neutral-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Flat pricing</h2>
        <p className="mt-2 text-neutral-500">Placeholder prices, to be set before launch.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Free", "$0", "500 DMs/month · unlimited automations · Funnel + Leads"],
            ["Pro", "$15/mo", "5,000 DMs · email gate · attribution · Studio"],
            ["Growth", "$29/mo", "20,000 DMs · AI step · API + MCP · team seats"],
          ].map(([n, p, d]) => (
            <div key={n} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="font-semibold">{n}</h3>
              <p className="mt-2 text-3xl font-semibold">{p}</p>
              <p className="mt-3 text-sm text-neutral-400">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-8 space-y-3">
          {faq.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-neutral-800 p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-neutral-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-900 px-5 py-8 text-center text-xs text-neutral-500">
        Loopline is not affiliated with or endorsed by Meta or Instagram.
      </footer>
    </main>
  );
}
