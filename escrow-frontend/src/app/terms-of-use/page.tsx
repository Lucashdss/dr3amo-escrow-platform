import type { Metadata } from "next";

import { LandingDocumentPage } from "@/components/landing/LandingDocumentPage";
import { LandingShell } from "@/components/landing/LandingShell";
import { TERMS_OF_USE_CONTENT } from "@/components/landing/landingDocumentContent";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  path: "/terms-of-use",
  title: "Terms of Use | Dr3amo",
  description: TERMS_OF_USE_CONTENT.description,
});

export default function TermsOfUsePage() {
  return (
    <LandingShell>
      <LandingDocumentPage {...TERMS_OF_USE_CONTENT} />
    </LandingShell>
  );
}
