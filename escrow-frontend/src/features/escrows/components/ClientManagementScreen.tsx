"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardUserCard } from "@/features/dashboard/components/DashboardUserCard";
import { useEscrowManagementList } from "@/features/escrows/hooks/useEscrowManagementList";
import {
  formatEscrowDate,
  formatEscrowRole,
  formatEscrowState,
  trimContractAddress,
} from "@/features/escrows/services/managementDisplay";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

type ManagementDisplayValues = {
  displayName: string;
  profileInitial: string;
  trimmedAddress: string;
};

export type ClientManagementScreenContentProps = {
  displayValues: ManagementDisplayValues;
  errorMessage: string | null;
  escrows: EscrowManagementItem[];
  hasUser: boolean;
  isLoading: boolean;
};

function getDisplayValues(
  address: string | undefined,
  username: string | undefined
): ManagementDisplayValues {
  const trimmedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Wallet not connected";

  return {
    displayName: username ?? trimmedAddress,
    profileInitial: (username?.[0] ?? address?.[2] ?? "C").toUpperCase(),
    trimmedAddress,
  };
}

function getRoleBadgeClassName(role: EscrowManagementItem["role"]): string {
  if (role === "client") {
    return "border-[#b6ef5f]/30 bg-[#b6ef5f]/14 text-[#d9f8a7]";
  }

  if (role === "freelancer") {
    return "border-[#f7a529]/30 bg-[#f7a529]/14 text-[#ffd494]";
  }

  return "border-white/15 bg-white/8 text-white/80";
}

function renderEscrowContent(
  isLoading: boolean,
  errorMessage: string | null,
  hasUser: boolean,
  escrows: EscrowManagementItem[]
) {
  if (isLoading) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Loading related escrows...
      </div>
    );
  }

  if (!hasUser) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Connect a wallet linked to a registered user to manage related escrows.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-[1.8rem] border border-[#ff7b7b]/25 bg-[#ff7b7b]/10 p-6 text-sm text-[#ffc5c5]">
        {errorMessage}
      </div>
    );
  }

  if (!escrows.length) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        No escrows are related to this user yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {escrows.map((escrow) => (
        <article
          key={escrow.id}
          className="rounded-[1.8rem] border border-white/10 bg-black/25 p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] ${getRoleBadgeClassName(escrow.role)}`}
            >
              {formatEscrowRole(escrow.role)}
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
              {formatEscrowState(escrow.state)}
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-black uppercase text-white">
            {escrow.escrowName}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Buyer
              </p>
              <p className="mt-2 text-sm text-white">{escrow.clientUsername}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Seller
              </p>
              <p className="mt-2 text-sm text-white">{escrow.freelancerUsername}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Deadline
              </p>
              <p className="mt-2 text-sm text-white">
                {formatEscrowDate(escrow.deadline)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Contract
              </p>
              <p className="mt-2 text-sm text-white">
                {trimContractAddress(escrow.contractAddress)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Escrow ID
              </p>
              <p className="mt-2 text-sm text-white">#{escrow.id}</p>
            </div>
            <Link
              href={`/client/management/${escrow.id}`}
              className="rounded-[1.4rem] border border-[#b6ef5f]/35 bg-[#b6ef5f] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105"
            >
              Manage Escrow
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ClientManagementScreenContent({
  displayValues,
  errorMessage,
  escrows,
  hasUser,
  isLoading,
}: ClientManagementScreenContentProps) {
  return (
    <DashboardShell activeNavLabel="Management">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[#b6ef5f]/20 bg-[#b6ef5f]/10 px-4 py-3 text-sm font-medium text-[#d8f5a7]">
              User scoped
            </div>
            <div className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/72">
              {escrows.length} related escrow{escrows.length === 1 ? "" : "s"}
            </div>
          </div>

          <div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
              Escrow Management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
              Review every escrow connected to your account and open a focused
              detail view for each contract.
            </p>
          </div>
        </div>

        <DashboardUserCard
          displayName={displayValues.displayName}
          hasUser={hasUser}
          profileInitial={displayValues.profileInitial}
          trimmedAddress={displayValues.trimmedAddress}
        />
      </header>

      <section>
        <article className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
          <div className="border-b border-white/10 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
              Contract access
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              Related Escrows
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Every row shows how the current user is connected to the escrow and
              links into a read-only management detail page.
            </p>
          </div>

          <div className="mt-8">
            {renderEscrowContent(isLoading, errorMessage, hasUser, escrows)}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}

export function ClientManagementScreen() {
  const { address } = useAccount();
  const { isLoading: isLoadingUser, user } = useCurrentUser();
  const management = useEscrowManagementList(user?.id);

  return (
    <ClientManagementScreenContent
      displayValues={getDisplayValues(address, user?.username)}
      errorMessage={management.error}
      escrows={management.escrows}
      hasUser={Boolean(user)}
      isLoading={isLoadingUser || management.isLoading}
    />
  );
}
