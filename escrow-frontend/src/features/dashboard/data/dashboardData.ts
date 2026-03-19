import {
  CalendarClock,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  FileClock,
  Handshake,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

import type {
  ActivityItem,
  KpiItem,
  NavItem,
  ToneClasses,
} from "@/features/dashboard/types/dashboard";

export const navItems: NavItem[] = [
  { href: "/client", icon: LayoutDashboard, label: "Overview" },
  { href: "/client/contracts", icon: Handshake, label: "Contracts" },
  { icon: Settings, label: "Settings" },
];

export function createClientKpis(
  fundsInEscrows: string,
  activeContractsCount: string,
  completedContractsCount: string,
  pendingReviewsCount: string,
  deadlinesApproachingCount: string
): KpiItem[] {
  return [
    {
      change: "",
      icon: CircleDollarSign,
      label: "Funds in Active Escrows",
      tone: "lime",
      value: fundsInEscrows,
    },
    {
      change: "Contracts currently active for this client",
      icon: ClipboardList,
      label: "Active Contracts",
      tone: "white",
      value: activeContractsCount,
    },
    {
      change: "Contracts currently waiting for your review",
      icon: FileClock,
      label: "Pending Reviews",
      tone: "amber",
      value: pendingReviewsCount,
    },
    {
      change: "Contracts with a deadline within 2 days",
      icon: CalendarClock,
      label: "Deadlines Approaching",
      tone: "amber",
      value: deadlinesApproachingCount,
    },
    {
      change: "Contracts finished or closed for this client",
      icon: CheckCheck,
      label: "Completed Contracts",
      tone: "lime",
      value: completedContractsCount,
    },
  ];
}

export const freelancerKpis: KpiItem[] = [
  {
    change: "+12.6% receiving this week",
    icon: CircleDollarSign,
    label: "Funds to Receive",
    tone: "lime",
    value: "$10.2k",
  },
  {
    change: "5 new this month",
    icon: ClipboardList,
    label: "Active Contracts",
    tone: "white",
    value: "18",
  },
  {
    change: "2 waiting on your approval",
    icon: FileClock,
    label: "Waiting Deliveries",
    tone: "amber",
    value: "07",
  },
  {
    change: "Next delivery due in 2 days",
    icon: CalendarClock,
    label: "Deadlines Approaching",
    tone: "amber",
    value: "04",
  },
  {
    change: "93% success rate this quarter",
    icon: CheckCheck,
    label: "Completed Contracts",
    tone: "lime",
    value: "29",
  },
];

export const dashboardActivity: ActivityItem[] = [
  {
    detail: "You approved the dashboard prototype for Northstar Studio.",
    icon: ShieldCheck,
    title: "Milestone approved",
    tone: "lime",
    when: "12 min ago",
  },
  {
    detail: "Helio Labs submitted testing notes for sign-off.",
    icon: Star,
    title: "Review requested",
    tone: "amber",
    when: "48 min ago",
  },
  {
    detail: "Orbital Commerce funded milestone 1 for $3,000.",
    icon: Wallet,
    title: "Escrow funded",
    tone: "white",
    when: "2 hrs ago",
  },
  {
    detail: "Signal Works moved delivery by 3 days after scope change.",
    icon: CalendarClock,
    title: "Deadline updated",
    tone: "amber",
    when: "Yesterday",
  },
];

export const toneClasses: ToneClasses = {
  amber: {
    border: "border-[#f7a529]/30",
    soft: "bg-[#f7a529]/14",
    text: "text-[#f7a529]",
  },
  lime: {
    border: "border-[#b6ef5f]/30",
    soft: "bg-[#b6ef5f]/14",
    text: "text-[#b6ef5f]",
  },
  white: {
    border: "border-white/15",
    soft: "bg-white/8",
    text: "text-[#f4f1eb]",
  },
};
