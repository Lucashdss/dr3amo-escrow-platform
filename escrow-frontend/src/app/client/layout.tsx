import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#2f3136] text-white">{children}</div>;
}
