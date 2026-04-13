import type { Metadata } from "next";

import { LandingDocumentPage } from "@/components/landing/LandingDocumentPage";
import { LandingShell } from "@/components/landing/LandingShell";
import { ABOUT_DR3AMO_CONTENT } from "@/components/landing/landingDocumentContent";

export const metadata: Metadata = {
  title: "About Dr3amo | Dr3amo",
  description: ABOUT_DR3AMO_CONTENT.description,
};

export default function AboutDr3amoPage() {
  return (
    <LandingShell>
      <LandingDocumentPage {...ABOUT_DR3AMO_CONTENT} />
    </LandingShell>
  );
}
