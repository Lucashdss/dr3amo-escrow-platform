import type { Metadata } from "next";

import { LandingHomePage } from "@/components/landing/LandingHomePage";
import {
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  createPublicPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  path: "/",
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
});

export default function HomePage() {
  return <LandingHomePage />;
}
