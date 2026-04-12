import type { ProtectedLandingRoute } from "@/components/landing/landingShowcase";

export type LandingNavItem = {
  label: string;
  href?: string;
  requiresWalletAuth?: boolean;
};

export type LandingNavSection = {
  items: LandingNavItem[];
  title: string;
};

export const LANDING_NAV_SECTIONS: LandingNavSection[] = [
  {
    title: "Resources",
    items: [
      {
        href: "/client",
        label: "Buyer Workspace",
        requiresWalletAuth: true,
      },
      {
        href: "/freelancer",
        label: "Seller Workspace",
        requiresWalletAuth: true,
      },
      {
        href: "/contracts",
        label: "Contract Archive",
        requiresWalletAuth: true,
      },
      {
        href: "/management",
        label: "Client Management",
        requiresWalletAuth: true,
      },
    ],
  },
  {
    title: "Escrow Flow",
    items: [
      { href: "/?showcase=buyer-dashboard#product-tour", label: "Connect Wallet" },
      { href: "/?showcase=create-escrow#product-tour", label: "Create Contract" },
      {
        href: "/?showcase=escrow-management#product-tour",
        label: "Manage Milestones",
      },
      {
        href: "/?showcase=escrow-details#product-tour",
        label: "Interact with Contracts",
      },
    ],
  },
  {
    title: "Community",
    items: [{ label: "Twitter" }, { label: "Instagram" }, { label: "Threads" }],
  },
  {
    title: "Company",
    items: [
      { label: "About Dr3amo" },
      { label: "Privacy Policy" },
      { label: "Terms of Use" },
      { href: "/#landing-contact", label: "Contact" },
    ],
  },
];

export function getProtectedLandingRoute(
  item: LandingNavItem
): ProtectedLandingRoute | null {
  if (item.requiresWalletAuth && item.href) {
    return item.href as ProtectedLandingRoute;
  }

  return null;
}
