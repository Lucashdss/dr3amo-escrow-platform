import type { Metadata } from "next";
import "@/styles/globals.css";
import { AnalyticsProvider } from "@/features/analytics/components/AnalyticsProvider";
import { getPublicAppUrl } from "@/lib/env/public";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: "Dr3amo | Secure Escrow Platform for Buyers and Sellers",
  description:
    "A decentralized escrow platform for buyers and sellers to protect payments and reduce risk in online transactions.",
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
