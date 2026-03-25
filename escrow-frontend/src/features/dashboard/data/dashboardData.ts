import {
  CalendarClock,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  FileClock,
  Handshake,
  LayoutDashboard,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

import type {
  ActivityItem,
  KpiItem,
  KpiValueOptions,
  NavItem,
  ToneClasses,
} from "@/features/dashboard/types/dashboard";

export const navItems: NavItem[] = [
  { href: "/client", icon: LayoutDashboard, label: "Overview" },
  { href: "/client/contracts", icon: Handshake, label: "Contracts" },
  { href: "/client/management", icon: Wallet, label: "Management" },
];

export function createClientKpis(
  fundsInEscrows: KpiValueOptions,
  activeContractsCount: string,
  completedContractsCount: string,
  pendingReviewsCount: string,
  deadlinesApproachingCount: string
): KpiItem[] {
  return [
    {
      icon: CircleDollarSign,
      label: "Funds in Active Escrows",
      tone: "lime",
      value: fundsInEscrows.USDC,
      valueOptions: fundsInEscrows,
    },
    {
      icon: ClipboardList,
      label: "Active Contracts",
      tone: "white",
      value: activeContractsCount,
    },
    {
      icon: FileClock,
      label: "Pending Reviews",
      tone: "amber",
      value: pendingReviewsCount,
    },
    {
      icon: CalendarClock,
      label: "Deadlines Approaching within 2 days",
      tone: "amber",
      value: deadlinesApproachingCount,
    },
    {
      icon: CheckCheck,
      label: "Completed Contracts",
      tone: "lime",
      value: completedContractsCount,
    },
  ];
}

export function createFreelancerKpis(
  fundsToReceive: KpiValueOptions,
  activeContractsCount: string,
  waitingDeliveriesCount: string,
  deadlinesApproachingCount: string,
  completedContractsCount: string
): KpiItem[] {
  return [
    {
      icon: CircleDollarSign,
      label: "Funds to Receive",
      tone: "lime",
      value: fundsToReceive.USDC,
      valueOptions: fundsToReceive,
    },
    {
      icon: ClipboardList,
      label: "Active Contracts",
      tone: "white",
      value: activeContractsCount,
    },
    {
      icon: FileClock,
      label: "Waiting Deliveries",
      tone: "amber",
      value: waitingDeliveriesCount,
    },
    {
      icon: CalendarClock,
      label: "Deadlines Approaching within 2 days",
      tone: "amber",
      value: deadlinesApproachingCount,
    },
    {
      icon: CheckCheck,
      label: "Completed Contracts",
      tone: "lime",
      value: completedContractsCount,
    },
  ];
}

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
