export type LandingNavItem = {
  href?: string;
  label: string;
};

export type LandingNavSection = {
  items: LandingNavItem[];
  title: string;
};

export const LANDING_NAV_SECTIONS: LandingNavSection[] = [
  {
    title: "Resources",
    items: [
      { href: "/client", label: "Buyer Workspace" },
      { href: "/freelancer", label: "Seller Workspace" },
      { href: "/client/contracts", label: "Contract Archive" },
      { href: "/client/management", label: "Client Management" },
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
