"use client";

import Link from "next/link";

import {
  LANDING_NAV_SECTIONS,
  getProtectedLandingRoute,
  type LandingNavItem,
} from "@/components/landing/landingNavigation";
import type { ProtectedLandingRoute } from "@/components/landing/landingShowcase";

type LandingHeaderNavProps = Readonly<{
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

type HeaderNavItemProps = Readonly<{
  item: LandingNavItem;
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

type HeaderNavDropdownProps = Readonly<{
  items: LandingNavItem[];
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
  title: string;
}>;

function HeaderNavItem({
  item,
  onProtectedNavigation,
}: HeaderNavItemProps) {
  const className =
    "block w-full rounded-2xl bg-transparent px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/6 hover:text-white";
  const protectedRoute = getProtectedLandingRoute(item);

  if (protectedRoute) {
    return (
      <button
        type="button"
        onClick={() => onProtectedNavigation(protectedRoute)}
        className={className}
      >
        {item.label}
      </button>
    );
  }

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
  onProtectedNavigation,
  title,
}: HeaderNavDropdownProps) {
  return (
    <div className="group relative pb-2">
      <span className="block cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium text-white/72 transition group-hover:bg-white/8 group-hover:text-white">
        {title}
      </span>
      <div className="pointer-events-none absolute left-1/2 top-[calc(100%-2px)] z-30 w-64 -translate-x-1/2 rounded-[1.5rem] border border-white/10 bg-[#202228]/95 p-3 opacity-0 shadow-[0_28px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <HeaderNavItem
              key={item.label}
              item={item}
              onProtectedNavigation={onProtectedNavigation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingHeaderNav({
  onProtectedNavigation,
}: LandingHeaderNavProps) {
  return (
    <nav className="hidden items-center justify-center gap-2 lg:flex">
      {LANDING_NAV_SECTIONS.map((section) => (
        <HeaderNavDropdown
          key={section.title}
          items={section.items}
          onProtectedNavigation={onProtectedNavigation}
          title={section.title}
        />
      ))}
    </nav>
  );
}
