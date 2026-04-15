import type { Metadata } from "next";
import "@/styles/globals.css";
import { getPublicAppUrl } from "@/lib/env/public";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: "Dr3amo | Secure Escrow Platform for Buyers and Sellers",
  description:
    "A decentralized escrow platform for buyers and sellers to protect payments and reduce risk in online transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
