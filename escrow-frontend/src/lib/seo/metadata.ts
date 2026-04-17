import type { Metadata } from "next";

import { getPublicAppUrl } from "@/lib/env/public";

export const SITE_NAME = "Dr3amo";
export const HOME_PAGE_TITLE =
  "Dr3amo | Secure Escrow Platform for Buyers and Sellers";
export const HOME_PAGE_DESCRIPTION =
  "A decentralized escrow platform for buyers and sellers to protect payments and reduce risk in online transactions.";

type PublicPageMetadataInput = Readonly<{
  path: string;
  title: string;
  description: string;
}>;

const PUBLIC_APP_URL = getPublicAppUrl();

function normalizePublicPath(path: string): string {
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  const normalizedPath = trimmedPath ? `/${trimmedPath}` : "/";

  return normalizedPath;
}

export function createCanonicalUrl(path: string): string {
  const normalizedPath = normalizePublicPath(path);
  const canonicalUrl =
    normalizedPath === "/"
      ? `${PUBLIC_APP_URL}/`
      : `${PUBLIC_APP_URL}${normalizedPath}`;

  return canonicalUrl;
}

function createOpenGraphMetadata({
  path,
  title,
  description,
}: PublicPageMetadataInput): Metadata["openGraph"] {
  const openGraphMetadata = {
    title,
    description,
    url: createCanonicalUrl(path),
    siteName: SITE_NAME,
    type: "website" as const,
  };

  return openGraphMetadata;
}

function createTwitterMetadata({
  title,
  description,
}: PublicPageMetadataInput): Metadata["twitter"] {
  const twitterMetadata = {
    card: "summary" as const,
    title,
    description,
  };

  return twitterMetadata;
}

export function createPublicPageMetadata(
  input: PublicPageMetadataInput
): Metadata {
  const canonicalUrl = createCanonicalUrl(input.path);
  const metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: createOpenGraphMetadata(input),
    twitter: createTwitterMetadata(input),
  } satisfies Metadata;

  return metadata;
}

export const APP_NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
