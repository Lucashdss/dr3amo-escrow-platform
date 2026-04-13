import type { Metadata } from "next";

import { LandingDocumentPage } from "@/components/landing/LandingDocumentPage";
import { LandingShell } from "@/components/landing/LandingShell";
import { TERMS_OF_USE_CONTENT } from "@/components/landing/landingDocumentContent";

export const metadata: Metadata = {
  title: "Terms of Use | Dr3amo",
  description: TERMS_OF_USE_CONTENT.description,
};

export default function TermsOfUsePage() {
  return (
    <LandingShell>
      <LandingDocumentPage {...TERMS_OF_USE_CONTENT} />
    </LandingShell>
  );
}
