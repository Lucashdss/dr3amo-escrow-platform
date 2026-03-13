import type { ComponentType } from "react";
import {
  CalendarClock,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  FileClock,
  FolderKanban,
  Heart,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

export type DashboardTone = "lime" | "amber" | "white";

export type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

export type KpiItem = {
  label: string;
  value: string;
  change: string;
  tone: DashboardTone;
  icon: ComponentType<{ className?: string }>;
};

export type ContractItem = {
  name: string;
  client: string;
  value: string;
  progress: number;
  status: "On Track" | "Needs Review" | "Funded";
  tone: DashboardTone;
};

export type DeadlineItem = {
  title: string;
  due: string;
  daysLeft: string;
  progress: number;
  tone: DashboardTone;
};

export type ActivityItem = {
  title: string;
  detail: string;
  when: string;
  tone: DashboardTone;
  icon: ComponentType<{ className?: string }>;
};

export const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Contracts", icon: FolderKanban },
  { label: "Settings", icon: Settings },
];

export const kpis: KpiItem[] = [
  {
    label: "Funds in Escrows",
    value: "$48.2k",
    change: "+12.6% funded this week",
    tone: "lime",
    icon: CircleDollarSign,
  },
  {
    label: "Active Contracts",
    value: "18",
    change: "5 are in milestone review",
    tone: "white",
    icon: ClipboardList,
  },
  {
    label: "Pending Reviews",
    value: "07",
    change: "2 waiting on your approval",
    tone: "amber",
    icon: FileClock,
  },
  {
    label: "Deadlines Approaching",
    value: "04",
    change: "Next delivery due in 2 days",
    tone: "amber",
    icon: CalendarClock,
  },
  {
    label: "Completed Contracts",
    value: "29",
    change: "93% success rate this quarter",
    tone: "lime",
    icon: CheckCheck,
  },
];

export const contracts: ContractItem[] = [
  {
    name: "Brand Identity Sprint",
    client: "Northstar Studio",
    value: "$6,800",
    progress: 82,
    status: "On Track",
    tone: "lime",
  },
  {
    name: "Marketplace QA Retainer",
    client: "Helio Labs",
    value: "$4,200",
    progress: 57,
    status: "Needs Review",
    tone: "amber",
  },
  {
    name: "Mobile App UI Refresh",
    client: "Orbital Commerce",
    value: "$9,100",
    progress: 68,
    status: "Funded",
    tone: "white",
  },
  {
    name: "Content Engine Buildout",
    client: "Signal Works",
    value: "$12,500",
    progress: 91,
    status: "On Track",
    tone: "lime",
  },
];

export const deadlines: DeadlineItem[] = [
  {
    title: "Approve homepage wireframes",
    due: "Mar 15",
    daysLeft: "2 days left",
    progress: 78,
    tone: "amber",
  },
  {
    title: "Release milestone 2 funding",
    due: "Mar 17",
    daysLeft: "4 days left",
    progress: 62,
    tone: "lime",
  },
  {
    title: "Review product audit notes",
    due: "Mar 19",
    daysLeft: "6 days left",
    progress: 48,
    tone: "white",
  },
  {
    title: "Confirm final delivery assets",
    due: "Mar 21",
    daysLeft: "8 days left",
    progress: 34,
    tone: "lime",
  },
];

export const activity: ActivityItem[] = [
  {
    title: "Milestone approved",
    detail: "You approved the dashboard prototype for Northstar Studio.",
    when: "12 min ago",
    tone: "lime",
    icon: ShieldCheck,
  },
  {
    title: "Review requested",
    detail: "Helio Labs submitted testing notes for sign-off.",
    when: "48 min ago",
    tone: "amber",
    icon: Star,
  },
  {
    title: "Escrow funded",
    detail: "Orbital Commerce funded milestone 1 for $3,000.",
    when: "2 hrs ago",
    tone: "white",
    icon: Wallet,
  },
  {
    title: "Deadline updated",
    detail: "Signal Works moved delivery by 3 days after scope change.",
    when: "Yesterday",
    tone: "amber",
    icon: CalendarClock,
  },
];

export const toneClasses = {
  lime: {
    bg: "bg-[#b6ef5f]",
    text: "text-[#b6ef5f]",
    soft: "bg-[#b6ef5f]/14",
    border: "border-[#b6ef5f]/30",
  },
  amber: {
    bg: "bg-[#f7a529]",
    text: "text-[#f7a529]",
    soft: "bg-[#f7a529]/14",
    border: "border-[#f7a529]/30",
  },
  white: {
    bg: "bg-[#f4f1eb]",
    text: "text-[#f4f1eb]",
    soft: "bg-white/8",
    border: "border-white/15",
  },
} as const;
