import type { ComponentType, ReactNode } from "react";

export type DashboardTone = "amber" | "lime" | "white";
export type KpiValueOption = "ETH" | "USDC";
export type KpiValueOptions = Record<KpiValueOption, string>;

export type NavItem = {
  href?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

export type KpiItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: DashboardTone;
  value: string;
  valueOptions?: KpiValueOptions;
};

export type ActivityItem = {
  detail: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  tone: DashboardTone;
  when: string;
};

export type ToneClasses = Record<
  DashboardTone,
  {
    border: string;
    soft: string;
    text: string;
  }
>;

export type DashboardHeroProps = {
  badge: ReactNode;
  description: string;
  title: string;
};
