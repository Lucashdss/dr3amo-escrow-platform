"use client";

import Link from "next/link";

import {
  LANDING_NAV_SECTIONS,
  getProtectedLandingRoute,
  type LandingNavItem,
} from "@/components/landing/landingNavigation";
import type { ProtectedLandingRoute } from "@/components/landing/landingShowcase";

type LandingFooterProps = Readonly<{
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

type FooterItemRowProps = Readonly<{
  item: LandingNavItem;
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

function FooterLogo() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white text-3xl font-black text-[#101010] shadow-[0_0_0_8px_rgba(255,255,255,0.05)]">
      D
    </div>
  );
}

function FooterItemRow({
  item,
  onProtectedNavigation,
}: FooterItemRowProps) {
  const className =
    "bg-transparent text-left text-lg text-white/50 transition duration-200 hover:text-white/78";
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

export function LandingFooter({ onProtectedNavigation }: LandingFooterProps) {
  return (
    <footer className="relative overflow-hidden bg-[#101010]">
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 py-16 md:px-10 lg:grid-cols-[180px_repeat(4,minmax(0,1fr))] lg:gap-10 lg:py-20">
        <div className="flex flex-col items-start gap-5">
          <FooterLogo />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">Dr3amo</p>
            <p className="max-w-[14rem] text-sm leading-6 text-white/45">
              Escrow system for seller work, enabling secure payments
              with transparent approval workflows and reliable payouts.
            </p>
          </div>
        </div>

        {LANDING_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-5">
            <h2 className="text-xl font-medium tracking-tight text-white">
              {section.title}
            </h2>
            <div className="flex flex-col gap-5">
              {section.items.map((item) => (
                <FooterItemRow
                  key={item.label}
                  item={item}
                  onProtectedNavigation={onProtectedNavigation}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
