import {
  CalendarClock,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  FileClock,
  Handshake,
  LayoutDashboard,
  Wallet,
} from "lucide-react";

import type {
  ActivityItem,
  KpiItem,
  KpiValueOptions,
  NavItem,
  ToneClasses,
} from "@/features/dashboard/types/dashboard";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";
import { formatEscrowState } from "@/features/escrows/services/managementDisplay";
import { normalizeEscrowDatabaseState } from "@/features/escrows/services/escrowShared";

export const navItems: NavItem[] = [
  { href: "/client", icon: LayoutDashboard, label: "Overview" },
  { href: "/contracts", icon: Handshake, label: "Contracts" },
  { href: "/management", icon: Wallet, label: "Management" },
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

function getActivityTimestamp(escrow: EscrowManagementItem): number {
  const activityTime = escrow.changedAt ?? escrow.createdAt;
  const parsedTime = Date.parse(activityTime);

  if (Number.isNaN(parsedTime)) {
    return 0;
  }

  return parsedTime;
}

function formatActivityTime(value: string | null | undefined): string {
  if (!value) {
    return "Unknown time";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getActivityTone(state: string): ActivityItem["tone"] {
  const normalizedState = normalizeEscrowDatabaseState(state);

  if (normalizedState === "released" || normalizedState === "funded") {
    return "lime";
  }

  if (
    normalizedState === "pending modification" ||
    normalizedState === "dispute" ||
    normalizedState === "cancelled"
  ) {
    return "amber";
  }

  return "white";
}

function getActivityIcon(state: string): ActivityItem["icon"] {
  const normalizedState = state.trim().toLowerCase();

  if (normalizedState === "funded") {
    return Wallet;
  }

  if (normalizedState === "released") {
    return CheckCheck;
  }

  if (normalizedState === "pending modification") {
    return CalendarClock;
  }

  if (normalizedState === "work submitted") {
    return FileClock;
  }

  return ClipboardList;
}

function createActivityDetail(escrow: EscrowManagementItem): string {
  const stateLabel = formatEscrowState(escrow.state);

  return `${escrow.escrowName} moved to ${stateLabel}.`;
}

export function createDashboardActivity(
  escrows: EscrowManagementItem[]
): ActivityItem[] {
  return [...escrows]
    .sort((leftEscrow, rightEscrow) => {
      return getActivityTimestamp(rightEscrow) - getActivityTimestamp(leftEscrow);
    })
    .slice(0, 5)
    .map((escrow) => {
      const stateLabel = formatEscrowState(escrow.state);

      return {
        detail: createActivityDetail(escrow),
        icon: getActivityIcon(escrow.state),
        title: stateLabel,
        tone: getActivityTone(escrow.state),
        when: formatActivityTime(escrow.changedAt ?? escrow.createdAt),
      };
    });
}

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
