import type { ReactNode } from "react";

import { DashboardNav } from "@/features/dashboard/components/DashboardNav";

type DashboardShellProps = {
  activeNavLabel: string;
  children: ReactNode;
  sideAction?: ReactNode;
};

export function DashboardShell({
  activeNavLabel,
  children,
  sideAction,
}: DashboardShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1800px] flex-col bg-black p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
      <div className="grid flex-1 gap-6 lg:grid-cols-[104px_minmax(0,1fr)]">
        <aside className="flex flex-row gap-4 lg:flex-col lg:justify-between">
          <div className="flex flex-1 flex-row items-start gap-4 lg:flex-col">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <div className="text-3xl font-black tracking-[-0.08em]">N</div>
            </div>
            <DashboardNav activeLabel={activeNavLabel} />
          </div>
          {sideAction ?? null}
        </aside>
        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
