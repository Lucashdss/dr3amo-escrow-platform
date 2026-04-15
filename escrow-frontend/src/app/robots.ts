import type { MetadataRoute } from "next";

import { getPublicAppUrl } from "@/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  const publicAppUrl = getPublicAppUrl();
  const robotsDefinition = {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${publicAppUrl}/sitemap.xml`,
  };

  return robotsDefinition;
}
