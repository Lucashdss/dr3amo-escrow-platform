export type DashboardRoute = "/client";

export type LandingShowcaseItem = {
  description: string;
  label: string;
  slug: string;
  title: string;
  src: string;
};

type PendingRouteState = {
  hasPendingRoute: boolean;
  hasUser: boolean;
  isCheckingUser: boolean;
  isConnected: boolean;
};

export const CREATE_CONTRACT_ROUTE: DashboardRoute = "/client";

export const LANDING_SHOWCASE_ITEMS: LandingShowcaseItem[] = [
  {
    description:
      "See every active agreement, track approvals, and move projects forward from a buyer workspace built for fast decisions.",
    label: "Buyer Dashboard",
    slug: "buyer-dashboard",
    title: "Stay in control of every buyer-side milestone.",
    src: "/landingPage/buyerDashboard.png",
  },
  {
    description:
      "Follow payouts, submissions, and contract progress from a seller dashboard that keeps your next release in view.",
    label: "Seller Dashboard",
    slug: "seller-dashboard",
    title: "Keep seller progress and payouts visible at a glance.",
    src: "/landingPage/sellerDashboard.png",
  },
  {
    description:
      "Build a new escrow in a single flow with clear pricing, milestone setup, and the right terms before funds move.",
    label: "Create Escrow",
    slug: "create-escrow",
    title: "Create contracts with a flow that stays clear from the start.",
    src: "/landingPage/createEscrow.png",
  },
  {
    description:
      "Manage open escrows, monitor status changes, and jump straight to the contracts that need attention now.",
    label: "Escrow Management",
    slug: "escrow-management",
    title: "Handle multiple escrows without losing the thread.",
    src: "/landingPage/escrowManagement.png",
  },
  {
    description:
      "Inspect each escrow in detail with milestone context, activity history, and the actions needed to move it forward.",
    label: "Escrow Details",
    slug: "escrow-details",
    title: "Review each escrow with the detail needed to act confidently.",
    src: "/landingPage/escrowDetails.png",
  },
];

export function getShowcaseIndexBySlug(slug: string | null): number {
  if (!slug) {
    return 0;
  }

  const showcaseIndex = LANDING_SHOWCASE_ITEMS.findIndex(
    (item) => item.slug === slug
  );

  return showcaseIndex >= 0 ? showcaseIndex : 0;
}

export function getNextShowcaseIndex(
  currentIndex: number,
  totalItems: number
): number {
  if (totalItems <= 1) {
    return 0;
  }

  return (currentIndex + 1) % totalItems;
}

export function shouldRedirectToPendingRoute(
  state: PendingRouteState
): boolean {
  return (
    state.hasPendingRoute &&
    state.isConnected &&
    !state.isCheckingUser &&
    state.hasUser
  );
}
