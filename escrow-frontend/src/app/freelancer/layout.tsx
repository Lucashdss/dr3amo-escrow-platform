import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_NO_INDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = APP_NO_INDEX_METADATA;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <div className="min-h-screen bg-[#2f3136] text-white">{children}</div>;
}
