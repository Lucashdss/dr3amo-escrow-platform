import type { Metadata } from "next";

import { LandingDocumentPage } from "@/components/landing/LandingDocumentPage";
import { LandingShell } from "@/components/landing/LandingShell";
import { PRIVACY_POLICY_CONTENT } from "@/components/landing/landingDocumentContent";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  path: "/privacy-policy",
  title: "Privacy Policy | Dr3amo",
  description: PRIVACY_POLICY_CONTENT.description,
});

export default function PrivacyPolicyPage() {
  return (
    <LandingShell>
      <LandingDocumentPage {...PRIVACY_POLICY_CONTENT} />
    </LandingShell>
  );
}
