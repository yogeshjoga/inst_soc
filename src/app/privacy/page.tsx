import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy | Loopline" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Loopline (&quot;we&quot;, &quot;us&quot;) lets Instagram Business and Creator accounts send an automatic direct message when
        someone comments a chosen keyword. This policy explains what data we handle and why.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>Account data: your email address and name, used to sign in to Loopline.</li>
        <li>Instagram account data you connect: your Instagram account ID, username and an access token issued by Instagram.</li>
        <li>
          Comment data: when a comment on your content arrives through Instagram&apos;s webhooks, we process the comment text, its ID,
          the post ID, and the commenter&apos;s Instagram ID and username.
        </li>
        <li>Message records: whether a direct message was sent or failed, and the time. We store the automation text you write.</li>
        <li>Lead records: the commenter&apos;s username, the keyword they used and the time, so you can see your results.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To match comments against your keywords and send the direct message or public reply you configured.</li>
        <li>To show you statistics, leads and activity in your dashboard.</li>
        <li>To enforce plan limits, prevent abuse and keep the service running.</li>
      </ul>
      <p>We do not sell personal data and we do not use Instagram data for advertising.</p>

      <h2>Who we share it with</h2>
      <p>
        We use service providers to run Loopline: Supabase (database and sign-in) and Vercel (hosting). We call Meta&apos;s Instagram
        APIs to read comments and send messages on your behalf. We share data only as needed to provide the service or if the law
        requires it.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your data while your account is active. You can ask us to delete your account and all associated data at any time. See{" "}
        <a href="/data-deletion">data deletion</a>. You can also disconnect Loopline from Instagram under Settings, Apps and websites.
      </p>

      <h2>Security</h2>
      <p>
        Access tokens are stored server-side and are not exposed to the browser. Webhook requests from Meta are verified by signature.
        No system is perfectly secure, but we work to protect your data.
      </p>

      <h2>Your rights</h2>
      <p>You can ask us to access, correct or delete your data by emailing us.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
