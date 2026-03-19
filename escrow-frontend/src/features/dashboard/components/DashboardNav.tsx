import Link from "next/link";

import { navItems } from "@/features/dashboard/data/dashboardData";

type DashboardNavProps = {
  activeLabel: string;
};

function getNavClassName(isActive: boolean): string {
  return `flex h-16 w-16 items-center justify-center rounded-[1.6rem] border transition ${
    isActive
      ? "border-white/20 bg-white/12 text-white"
      : "border-white/10 bg-white/8 text-white/72 hover:bg-white/12"
  }`;
}

export function DashboardNav({ activeLabel }: DashboardNavProps) {
  return (
    <nav className="flex flex-1 flex-row flex-wrap gap-3 lg:flex-col">
      {navItems.map(({ href, icon: Icon, label }) => {
        const content = <Icon className="h-6 w-6" />;

        if (href) {
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={getNavClassName(label === activeLabel)}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={label}
            type="button"
            aria-label={label}
            className={getNavClassName(label === activeLabel)}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
