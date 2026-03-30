import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Dr3amo",
  description: "Secure escrow payments for freelance projects.",
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
