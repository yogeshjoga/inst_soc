import type { ReactNode } from "react";

export const CONTACT_EMAIL = "jogayogeshedu@gmail.com";
export const UPDATED = "19 October 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-10 text-neutral-200">
      <article className="mx-auto max-w-2xl space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_a]:text-fuchsia-400">
        <a href="/" className="text-sm">&larr; Loopline</a>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-neutral-500">Last updated {UPDATED}</p>
        {children}
        <nav className="mt-10 flex gap-4 border-t border-neutral-800 pt-4 text-sm">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/data-deletion">Data deletion</a>
        </nav>
      </article>
    </main>
  );
}
