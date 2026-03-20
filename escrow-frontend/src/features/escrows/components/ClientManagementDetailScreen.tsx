"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardUserCard } from "@/features/dashboard/components/DashboardUserCard";
import { useEscrowManagementDetail } from "@/features/escrows/hooks/useEscrowManagementDetail";
import {
  formatEscrowDate,
  formatEscrowRole,
  formatEscrowState,
  getCounterpartyLabel,
  getCounterpartyTitle,
  getEscrowChainLabel,
  getEscrowTokenLabel,
  trimContractAddress,
} from "@/features/escrows/services/managementDisplay";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

type ManagementDetailDisplayValues = {
  displayName: string;
  profileInitial: string;
  trimmedAddress: string;
};

export type ClientManagementDetailScreenContentProps = {
  displayValues: ManagementDetailDisplayValues;
  errorMessage: string | null;
  escrow: EscrowManagementItem | null;
  hasUser: boolean;
  isLoading: boolean;
};

function getDisplayValues(
  address: string | undefined,
  username: string | undefined
): ManagementDetailDisplayValues {
  const trimmedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Wallet not connected";

  return {
    displayName: username ?? trimmedAddress,
    profileInitial: (username?.[0] ?? address?.[2] ?? "C").toUpperCase(),
    trimmedAddress,
  };
}

function renderEscrowDetail(
  isLoading: boolean,
  errorMessage: string | null,
  hasUser: boolean,
  escrow: EscrowManagementItem | null
) {
  if (isLoading) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Loading escrow detail...
      </div>
    );
  }

  if (!hasUser) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Connect a wallet linked to a registered user to access escrow detail.
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

  if (!escrow) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Escrow detail is not available.
      </div>
    );
  }

  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/25 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[#b6ef5f]/30 bg-[#b6ef5f]/14 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d9f8a7]">
          {formatEscrowRole(escrow.role)}
        </span>
        <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
          {formatEscrowState(escrow.state)}
        </span>
      </div>

      <h2 className="mt-5 text-3xl font-black uppercase text-white">
        {escrow.escrowName}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
        {getCounterpartyTitle(escrow.role)}: {getCounterpartyLabel(escrow)}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Client
          </p>
          <p className="mt-2 text-sm text-white">{escrow.clientUsername}</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Freelancer
          </p>
          <p className="mt-2 text-sm text-white">{escrow.freelancerUsername}</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Contract address
          </p>
          <p className="mt-2 text-sm text-white">
            {trimContractAddress(escrow.contractAddress)}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Deadline
          </p>
          <p className="mt-2 text-sm text-white">
            {formatEscrowDate(escrow.deadline)}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Chain
          </p>
          <p className="mt-2 text-sm text-white">
            {getEscrowChainLabel(escrow.chainId)}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Token
          </p>
          <p className="mt-2 text-sm text-white">
            {getEscrowTokenLabel(escrow.tokenId)}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Amount
          </p>
          <p className="mt-2 text-sm text-white">{escrow.amount}</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Created
          </p>
          <p className="mt-2 text-sm text-white">
            {formatEscrowDate(escrow.createdAt)}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Escrow ID
          </p>
          <p className="mt-2 text-sm text-white">#{escrow.id}</p>
        </div>
      </div>
    </article>
  );
}

export function ClientManagementDetailScreenContent({
  displayValues,
  errorMessage,
  escrow,
  hasUser,
  isLoading,
}: ClientManagementDetailScreenContentProps) {
  return (
    <DashboardShell activeNavLabel="Management">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/client/management"
              className="rounded-full border border-white/10 bg-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65 transition hover:bg-white/12 hover:text-white"
            >
              Back to Management
            </Link>
            <div className="rounded-full border border-[#b6ef5f]/20 bg-[#b6ef5f]/10 px-4 py-3 text-sm font-medium text-[#d8f5a7]">
              Read-only detail
            </div>
          </div>

          <div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
              Escrow Detail
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
              Review contract identity, participants, funding metadata, and timing
              without changing the escrow state.
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

      <section>{renderEscrowDetail(isLoading, errorMessage, hasUser, escrow)}</section>
    </DashboardShell>
  );
}

export function ClientManagementDetailScreen() {
  const params = useParams<{ id: string }>();
  const escrowId = Number.parseInt(params.id, 10);
  const { address } = useAccount();
  const { isLoading: isLoadingUser, user } = useCurrentUser();
  const detail = useEscrowManagementDetail(
    Number.isInteger(escrowId) ? escrowId : undefined,
    user?.id
  );

  return (
    <ClientManagementDetailScreenContent
      displayValues={getDisplayValues(address, user?.username)}
      errorMessage={detail.error}
      escrow={detail.escrow}
      hasUser={Boolean(user)}
      isLoading={isLoadingUser || detail.isLoading}
    />
  );
}
