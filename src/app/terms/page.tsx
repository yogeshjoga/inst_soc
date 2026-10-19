import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Terms of Service | Loopline" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By creating a Loopline account or using the service, you agree to these terms.</p>

      <h2>The service</h2>
      <p>
        Loopline connects to your Instagram Business or Creator account and, when a comment matches a keyword you set, sends the
        direct message and optional public reply you configured. Features and limits depend on your plan.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>You must own or be authorized to manage the Instagram account you connect.</li>
        <li>You must follow Instagram&apos;s and Meta&apos;s terms, policies and platform rules, including messaging rules.</li>
        <li>Do not use Loopline to send spam, deceptive, harassing, illegal or unsolicited content.</li>
        <li>You are responsible for the messages you configure and for having any permission needed to contact people.</li>
      </ul>

      <h2>Limits and suspension</h2>
      <p>
        Plans include a monthly number of direct messages. We may suspend or end accounts that break these terms, abuse the service or
        put it at risk. Meta may also change or limit what its APIs allow, and that can affect the service.
      </p>

      <h2>No guarantee</h2>
      <p>
        The service is provided &quot;as is&quot;. Delivery of messages depends on Instagram and is not guaranteed. To the extent the law
        allows, we are not liable for indirect or consequential losses.
      </p>

      <h2>Ending your account</h2>
      <p>
        You may stop using Loopline at any time and ask us to delete your data. See <a href="/data-deletion">data deletion</a>.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the new terms.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
