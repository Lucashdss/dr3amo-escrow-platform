import { ArrowUpRight } from "lucide-react";

import { toneClasses } from "@/features/dashboard/data/dashboardData";
import type { ActivityItem } from "@/features/dashboard/types/dashboard";

type DashboardActivityFeedProps = Readonly<{
  errorMessage: string | null;
  isLoading: boolean;
  items: ActivityItem[];
}>;

function renderActivityContent(
  items: ActivityItem[],
  isLoading: boolean,
  errorMessage: string | null
) {
  if (isLoading) {
    return (
      <p className="rounded-[1.7rem] border border-white/10 bg-black/25 p-4 text-sm text-white/56">
        Loading recent activity...
      </p>
    );
  }

  if (errorMessage) {
    return (
      <p className="rounded-[1.7rem] border border-[#f7a529]/20 bg-[#f7a529]/8 p-4 text-sm text-[#ffd494]">
        {errorMessage}
      </p>
    );
  }

  if (!items.length) {
    return (
      <p className="rounded-[1.7rem] border border-white/10 bg-black/25 p-4 text-sm text-white/56">
        No escrow changes yet.
      </p>
    );
  }

  return items.map(({ detail, icon: Icon, title, tone, when }) => (
    <div
      key={`${title}-${when}-${detail}`}
      className="flex items-start gap-4 rounded-[1.7rem] border border-white/10 bg-black/25 p-4"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[tone].soft} ${toneClasses[tone].border}`}
      >
        <Icon className={`h-5 w-5 ${toneClasses[tone].text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-white">{title}</p>
          <span className="text-sm text-white/42">{when}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-white/56">{detail}</p>
      </div>
    </div>
  ));
}

export function DashboardActivityFeed({
  errorMessage,
  isLoading,
  items,
}: DashboardActivityFeedProps) {
  return (
    <section className="min-w-0 flex-1">
      <div className="grid min-w-0 gap-6">
        <article className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
                Feed
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase text-white">
                Recent Activity
              </h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-white/45" />
          </div>

          <div className="mt-8 space-y-4">
            {renderActivityContent(items, isLoading, errorMessage)}
          </div>
        </article>
      </div>
    </section>
  );
}
