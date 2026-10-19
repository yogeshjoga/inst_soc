import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Data Deletion | Loopline" };

export default function DataDeletion() {
  return (
    <LegalPage title="Data Deletion Instructions">
      <p>You can remove your data from Loopline in either of these ways.</p>

      <h2>1. Disconnect Loopline from Instagram</h2>
      <ul>
        <li>In Instagram, go to Settings, then Apps and websites.</li>
        <li>Find Loopline and remove it. This stops Loopline from reading comments or sending messages for your account.</li>
      </ul>

      <h2>2. Ask us to delete your data</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}?subject=Loopline%20data%20deletion`}>{CONTACT_EMAIL}</a> from the email address you
        signed up with, with the subject &quot;Loopline data deletion&quot;. Include your Instagram username so we can find your records.
      </p>
      <p>We will delete the following within 30 days and confirm by email:</p>
      <ul>
        <li>Your Loopline account and profile</li>
        <li>Your connected Instagram account details and access token</li>
        <li>Your automations, leads and message records</li>
      </ul>
      <p>
        If you are a person who commented on a connected account and want your comment-related records removed, email us with your
        Instagram username and we will delete them.
      </p>
    </LegalPage>
  );
}
