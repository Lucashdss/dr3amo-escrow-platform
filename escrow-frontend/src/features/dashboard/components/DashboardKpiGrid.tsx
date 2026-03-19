import { toneClasses } from "@/features/dashboard/data/dashboardData";
import type { KpiItem } from "@/features/dashboard/types/dashboard";

type DashboardKpiGridProps = {
  items: KpiItem[];
};

export function DashboardKpiGrid({ items }: DashboardKpiGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ change, icon: Icon, label, tone, value }) => (
        <article
          key={label}
          className="rounded-[1.6rem] border border-white/10 bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneClasses[tone].soft} ${toneClasses[tone].border}`}
            >
              <Icon className={`h-4 w-4 ${toneClasses[tone].text}`} />
            </div>
            <span className={`text-[11px] font-semibold ${toneClasses[tone].text}`}>
              Live view
            </span>
          </div>
          <p className="mt-6 text-[2rem] font-black tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/58">
            {label}
          </p>
          <p className="mt-4 text-xs leading-5 text-white/52">{change}</p>
        </article>
      ))}
    </section>
  );
}
