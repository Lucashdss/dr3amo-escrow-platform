import type { MetadataRoute } from "next";

import { createCanonicalUrl } from "@/lib/seo/metadata";

type SitemapEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const PUBLIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about-dr3amo", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-use", changeFrequency: "yearly", priority: 0.3 },
];

function createSitemapUrl(path: string): string {
  const sitemapUrl = createCanonicalUrl(path);

  return sitemapUrl;
}

function createSitemapEntry(entry: SitemapEntry): MetadataRoute.Sitemap[number] {
  const sitemapEntry = {
    url: createSitemapUrl(entry.path),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  };

  return sitemapEntry;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries = PUBLIC_SITEMAP_ENTRIES.map(createSitemapEntry);

  return sitemapEntries;
}
