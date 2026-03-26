import Link from "next/link";

import {
  LANDING_NAV_SECTIONS,
  type LandingNavItem,
} from "@/components/landing/landingNavigation";

function HeaderNavItem({ item }: { item: LandingNavItem }) {
  const className =
    "block rounded-2xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/6 hover:text-white";

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {item.label}
      </Link>
    );
  }

  return <span className={className}>{item.label}</span>;
}

function HeaderNavDropdown({
  items,
  title,
}: {
  items: LandingNavItem[];
  title: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-full px-4 py-2 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white"
      >
        {title}
      </button>
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-64 -translate-x-1/2 rounded-[1.5rem] border border-white/10 bg-[#202228]/95 p-3 opacity-0 shadow-[0_28px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <HeaderNavItem key={item.label} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingHeaderNav() {
  return (
    <nav className="hidden items-center justify-center gap-2 lg:flex">
      {LANDING_NAV_SECTIONS.map((section) => (
        <HeaderNavDropdown
          key={section.title}
          items={section.items}
          title={section.title}
        />
      ))}
    </nav>
  );
}
