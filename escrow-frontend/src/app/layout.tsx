import type { Metadata } from "next";
import "@/styles/globals.css";
import { AnalyticsProvider } from "@/features/analytics/components/AnalyticsProvider";
import { getPublicAppUrl } from "@/lib/env/public";
import { SITE_NAME } from "@/lib/seo/metadata";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: SITE_NAME,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      {
        url: "/websiteIcon/websiteIcon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/websiteIcon/websiteIcon.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AnalyticsProvider>
          <Providers>{children}</Providers>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
