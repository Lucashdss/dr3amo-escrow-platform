"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  createClientKpis,
  createFreelancerKpis,
} from "@/features/dashboard/data/dashboardData";
import { DashboardActivityFeed } from "@/features/dashboard/components/DashboardActivityFeed";
import { DashboardKpiGrid } from "@/features/dashboard/components/DashboardKpiGrid";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardUserCard } from "@/features/dashboard/components/DashboardUserCard";
import { useDashboardActivity } from "@/features/dashboard/hooks/useDashboardActivity";
import { useClientEscrowFunds } from "@/features/dashboard/hooks/useClientEscrowFunds";
import { useFreelancerEscrowFunds } from "@/features/dashboard/hooks/useFreelancerEscrowFunds";

type DashboardOverviewScreenProps = Readonly<{
  switchDashboardHref: string;
  switchDashboardLabel: string;
  title: string;
  variant: "client" | "freelancer";
}>;

function getDisplayValues(address: string | undefined, username: string | undefined) {
  const trimmedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Wallet not connected";
  const displayName = username ?? trimmedAddress;
  const profileInitial = (username?.[0] ?? address?.[2] ?? "C").toUpperCase();

  return {
    displayName,
    profileInitial,
    trimmedAddress,
  };
}

export function DashboardOverviewScreen({
  switchDashboardHref,
  switchDashboardLabel,
  title,
  variant,
}: DashboardOverviewScreenProps) {
  const { address } = useAccount();
  const { user } = useCurrentUser();
  const clientEscrowFunds = useClientEscrowFunds();
  const freelancerEscrowFunds = useFreelancerEscrowFunds();
  const activityFeed = useDashboardActivity();
  const displayValues = getDisplayValues(address, user?.username);
  const kpis =
    variant === "client"
      ? createClientKpis(
        {
          ETH: clientEscrowFunds.fundsInEscrowsEth,
          USDC: clientEscrowFunds.fundsInEscrowsUsdc,
        },
        clientEscrowFunds.activeContractsCount,
        clientEscrowFunds.completedContractsCount,
        clientEscrowFunds.pendingReviewsCount,
        clientEscrowFunds.deadlinesApproachingCount
      )
      : createFreelancerKpis(
        {
          ETH: freelancerEscrowFunds.fundsToReceiveEth,
          USDC: freelancerEscrowFunds.fundsToReceiveUsdc,
        },
        freelancerEscrowFunds.activeContractsCount,
        freelancerEscrowFunds.waitingDeliveriesCount,
        freelancerEscrowFunds.deadlinesApproachingCount,
        freelancerEscrowFunds.completedContractsCount
      );

  return (
    <DashboardShell activeNavLabel="Overview">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={switchDashboardHref}
              className="rounded-full border border-white/10 bg-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65 transition hover:bg-white/12 hover:text-white"
            >
              {switchDashboardLabel}
            </Link>
          </div>

          <div>
            <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Track escrow health, contract momentum, review load, and upcoming
              delivery pressure in one place.
            </p>
          </div>
        </div>

        <DashboardUserCard
          displayName={displayValues.displayName}
          hasUser={Boolean(user?.username)}
          profileInitial={displayValues.profileInitial}
          trimmedAddress={displayValues.trimmedAddress}
        />
      </header>

      <DashboardKpiGrid items={kpis} />
      <DashboardActivityFeed
        errorMessage={activityFeed.error}
        isLoading={activityFeed.isLoading}
        items={activityFeed.items}
      />
    </DashboardShell>
  );
}
