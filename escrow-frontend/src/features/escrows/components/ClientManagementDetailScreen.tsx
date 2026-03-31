"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardUserCard } from "@/features/dashboard/components/DashboardUserCard";
import { getEscrowActionDefinition } from "@/features/escrows/config/escrowContract";
import { useEscrowManagementActions } from "@/features/escrows/hooks/useEscrowManagementActions";
import { useEscrowManagementDetail } from "@/features/escrows/hooks/useEscrowManagementDetail";
import {
  formatMinimumPriceValue,
} from "@/features/escrows/services/escrowActions";
import {
  formatEscrowDate,
  formatEscrowDateTime,
  formatEscrowRole,
  formatEscrowState,
  getEscrowChainLabel,
  getEscrowTokenLabel,
} from "@/features/escrows/services/managementDisplay";
import type {
  EscrowActionAvailability,
  EscrowActionKey,
  EscrowLiveSnapshot,
  EscrowManagementItem,
} from "@/features/escrows/types/escrow";

type ManagementDetailDisplayValues = {
  displayName: string;
  profileInitial: string;
  trimmedAddress: string;
};

export type ClientManagementDetailScreenContentProps = {
  actionError: string | null;
  actionStatus: string | null;
  actionSuccess: string | null;
  actions: EscrowActionAvailability[];
  amountInput: string;
  deadlineExtensionInput: string;
  displayValues: ManagementDetailDisplayValues;
  errorMessage: string | null;
  escrow: EscrowManagementItem | null;
  hasUser: boolean;
  isActionMenuOpen: boolean;
  isExecuting: boolean;
  isLoading: boolean;
  isLoadingLiveEscrowState: boolean;
  isLoadingLiveSnapshot: boolean;
  liveSnapshot: EscrowLiveSnapshot | null;
  selectedAction: EscrowActionKey | null;
  submittedHash: string | null;
  usdAmountInput: string;
  onAmountInputChange: (value: string) => void;
  onCloseActionMenu: () => void;
  onCloseSelectedAction: () => void;
  onDeadlineExtensionInputChange: (value: string) => void;
  onOpenActionMenu: () => void;
  onSelectAction: (action: EscrowActionKey) => void;
  onSubmitSelectedAction: () => void;
  onUsdAmountInputChange: (value: string) => void;
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

function getLiveSnapshotValue(
  value: number | string | null | undefined,
  fallback = "Unavailable"
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value.toString();
}

function renderActionInput(
  selectedAction: EscrowActionKey,
  amountInput: string,
  usdAmountInput: string,
  deadlineExtensionInput: string,
  onAmountInputChange: (value: string) => void,
  onUsdAmountInputChange: (value: string) => void,
  onDeadlineExtensionInputChange: (value: string) => void
) {
  const actionDefinition = getEscrowActionDefinition(selectedAction);

  if (actionDefinition.inputKind === "amount") {
    return (
      <label className="grid gap-2 text-sm text-white/72">
        Funding amount
        <input
          value={amountInput}
          onChange={(event) => onAmountInputChange(event.target.value)}
          className="rounded-[1rem] border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[#b6ef5f]/45"
          placeholder="0.00"
        />
      </label>
    );
  }

  if (actionDefinition.inputKind === "usd") {
    return (
      <label className="grid gap-2 text-sm text-white/72">
        Minimum price in USD
        <input
          value={usdAmountInput}
          onChange={(event) => onUsdAmountInputChange(event.target.value)}
          className="rounded-[1rem] border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[#b6ef5f]/45"
          placeholder="1000"
        />
      </label>
    );
  }

  if (actionDefinition.inputKind === "days") {
    return (
      <label className="grid gap-2 text-sm text-white/72">
        Extension in days
        <input
          value={deadlineExtensionInput}
          onChange={(event) => onDeadlineExtensionInputChange(event.target.value)}
          className="rounded-[1rem] border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[#b6ef5f]/45"
          placeholder="2"
        />
      </label>
    );
  }

  return (
    <p className="text-sm leading-6 text-white/60">
      Confirm that you want to continue with this contract action.
    </p>
  );
}

function renderActionModal(
  selectedAction: EscrowActionKey | null,
  amountInput: string,
  usdAmountInput: string,
  deadlineExtensionInput: string,
  actionError: string | null,
  actionStatus: string | null,
  actionSuccess: string | null,
  submittedHash: string | null,
  isExecuting: boolean,
  onAmountInputChange: (value: string) => void,
  onUsdAmountInputChange: (value: string) => void,
  onDeadlineExtensionInputChange: (value: string) => void,
  onCloseSelectedAction: () => void,
  onSubmitSelectedAction: () => void
) {
  if (!selectedAction) {
    return null;
  }

  const actionDefinition = getEscrowActionDefinition(selectedAction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-[1.8rem] border border-white/10 bg-[#101010] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Escrow Action
            </p>
            <h3 className="mt-3 text-2xl font-black uppercase text-white">
              {actionDefinition.label}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {actionDefinition.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseSelectedAction}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          {renderActionInput(
            selectedAction,
            amountInput,
            usdAmountInput,
            deadlineExtensionInput,
            onAmountInputChange,
            onUsdAmountInputChange,
            onDeadlineExtensionInputChange
          )}
        </div>

        {actionStatus ? (
          <div className="mt-5 rounded-[1.2rem] border border-white/12 bg-white/6 p-4 text-sm text-white/75">
            {actionStatus}
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#ff7b7b]/25 bg-[#ff7b7b]/10 p-4 text-sm text-[#ffc5c5]">
            {actionError}
          </div>
        ) : null}

        {actionSuccess ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#b6ef5f]/25 bg-[#b6ef5f]/10 p-4 text-sm text-[#d9f8a7]">
            <p>{actionSuccess}</p>
            {submittedHash ? <p className="mt-2 break-all">Tx: {submittedHash}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCloseSelectedAction}
            className="rounded-[1rem] border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExecuting}
            onClick={onSubmitSelectedAction}
            className="rounded-[1rem] border border-[#b6ef5f]/35 bg-[#b6ef5f] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExecuting ? "Processing..." : actionDefinition.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderActionMenu(
  actions: EscrowActionAvailability[],
  isActionMenuOpen: boolean,
  isLoadingLiveEscrowState: boolean,
  onOpenActionMenu: () => void,
  onCloseActionMenu: () => void,
  onSelectAction: (action: EscrowActionKey) => void
) {
  return (
    <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={isActionMenuOpen ? onCloseActionMenu : onOpenActionMenu}
          className="rounded-[1rem] border border-[#b6ef5f]/35 bg-[#b6ef5f] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105"
        >
          {isActionMenuOpen ? "Hide Actions" : "Actions"}
        </button>
      </div>

      {isActionMenuOpen ? (
        <div className="mt-5 grid gap-3">
          {isLoadingLiveEscrowState ? (
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">
              Refreshing contract state...
            </p>
          ) : null}

          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={action.disabled}
              onClick={() => onSelectAction(action.key)}
              className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/4 disabled:text-white/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    {action.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {action.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    action.disabled
                      ? "bg-[#c93030] text-white"
                      : "bg-[#2f9e44] text-white"
                  }`}
                >
                  {action.disabled ? "Disabled" : "Ready"}
                </span>
              </div>

              {action.disabledReason ? (
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#f7a529]">
                  {action.disabledReason}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderEscrowDetail(
  props: ClientManagementDetailScreenContentProps
) {
  if (props.isLoading) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Loading escrow detail...
      </div>
    );
  }

  if (!props.hasUser) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Connect a wallet linked to a registered user to access escrow detail.
      </div>
    );
  }

  if (props.errorMessage) {
    return (
      <div className="rounded-[1.8rem] border border-[#ff7b7b]/25 bg-[#ff7b7b]/10 p-6 text-sm text-[#ffc5c5]">
        {props.errorMessage}
      </div>
    );
  }

  if (!props.escrow) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
        Escrow detail is not available.
      </div>
    );
  }

  return (
    <>
      <article className="rounded-[2rem] border border-white/10 bg-black/25 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#b6ef5f]/30 bg-[#b6ef5f]/14 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d9f8a7]">
            {formatEscrowRole(props.escrow.role)}
          </span>
          <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
            {formatEscrowState(props.escrow.state)}
          </span>
          {props.isLoadingLiveSnapshot ? (
            <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Refreshing live contract data
            </span>
          ) : null}
        </div>

        <h2 className="mt-5 text-3xl font-black uppercase text-white">
          {props.escrow.escrowName}
        </h2>

        {renderActionMenu(
          props.actions,
          props.isActionMenuOpen,
          props.isLoadingLiveEscrowState,
          props.onOpenActionMenu,
          props.onCloseActionMenu,
          props.onSelectAction
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Buyer
            </p>
            <p className="mt-2 text-sm text-white">{props.escrow.clientUsername}</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Seller
            </p>
            <p className="mt-2 text-sm text-white">
              {props.escrow.freelancerUsername}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Contract address
            </p>
            <p className="mt-2 text-sm text-white">
              {props.escrow.contractAddress}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Deadline
            </p>
            <p className="mt-2 text-sm text-white">
              {formatEscrowDate(props.escrow.deadline)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Chain
            </p>
            <p className="mt-2 text-sm text-white">
              {getEscrowChainLabel(props.escrow.chainId)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Token
            </p>
            <p className="mt-2 text-sm text-white">
              {getEscrowTokenLabel(props.escrow.tokenId)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Amount
            </p>
            <p className="mt-2 text-sm text-white">{props.escrow.amount}</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Minimum price
            </p>
            <p className="mt-2 text-sm text-white">
              {formatMinimumPriceValue(props.liveSnapshot?.minimumPriceUsd ?? null)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Modifications requested
            </p>
            <p className="mt-2 text-sm text-white">
              {getLiveSnapshotValue(props.liveSnapshot?.modificationsRequested, "0")}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Created
            </p>
            <p className="mt-2 text-sm text-white">
              {formatEscrowDate(props.escrow.createdAt)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Last updated
            </p>
            <p className="mt-2 text-sm text-white">
              {formatEscrowDateTime(
                props.escrow.changedAt ?? props.escrow.createdAt
              )}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Escrow ID
            </p>
            <p className="mt-2 text-sm text-white">#{props.escrow.id}</p>
          </div>
        </div>
      </article>

      {renderActionModal(
        props.selectedAction,
        props.amountInput,
        props.usdAmountInput,
        props.deadlineExtensionInput,
        props.actionError,
        props.actionStatus,
        props.actionSuccess,
        props.submittedHash,
        props.isExecuting,
        props.onAmountInputChange,
        props.onUsdAmountInputChange,
        props.onDeadlineExtensionInputChange,
        props.onCloseSelectedAction,
        props.onSubmitSelectedAction
      )}
    </>
  );
}

export function ClientManagementDetailScreenContent(
  props: ClientManagementDetailScreenContentProps
) {
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
          </div>

          <div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
              Escrow Detail
            </h1>
          </div>
        </div>

        <DashboardUserCard
          displayName={props.displayValues.displayName}
          hasUser={props.hasUser}
          profileInitial={props.displayValues.profileInitial}
          trimmedAddress={props.displayValues.trimmedAddress}
        />
      </header>

      <section>{renderEscrowDetail(props)}</section>
    </DashboardShell>
  );
}

export function ClientManagementDetailScreen() {
  const params = useParams<{ id: string }>();
  const escrowId = Number.parseInt(params.id, 10);
  const { address } = useAccount();
  const { isLoading: isLoadingUser, user } = useCurrentUser();
  const detail = useEscrowManagementDetail(
    Number.isInteger(escrowId) ? escrowId : undefined
  );
  const actions = useEscrowManagementActions({
    escrow: detail.escrow,
    liveEscrowState: detail.liveEscrowState,
    liveSnapshot: detail.liveSnapshot,
    refreshDetail: detail.refresh,
    refreshLiveEscrowState: detail.refreshLiveEscrowState,
  });

  return (
    <ClientManagementDetailScreenContent
      actionError={actions.actionError}
      actionStatus={actions.actionStatus}
      actionSuccess={actions.actionSuccess}
      actions={actions.actions}
      amountInput={actions.amountInput}
      deadlineExtensionInput={actions.deadlineExtensionInput}
      displayValues={getDisplayValues(address, user?.username)}
      errorMessage={detail.error}
      escrow={detail.escrow}
      hasUser={Boolean(user)}
      isActionMenuOpen={actions.isActionMenuOpen}
      isExecuting={actions.isExecuting}
      isLoading={isLoadingUser || detail.isLoading}
      isLoadingLiveEscrowState={detail.isLoadingLiveEscrowState}
      isLoadingLiveSnapshot={detail.isLoadingLiveSnapshot}
      liveSnapshot={detail.liveSnapshot}
      onAmountInputChange={actions.setAmountInput}
      onCloseActionMenu={actions.closeActionMenu}
      onCloseSelectedAction={actions.closeSelectedAction}
      onDeadlineExtensionInputChange={actions.setDeadlineExtensionInput}
      onOpenActionMenu={() => {
        void actions.openActionMenu();
      }}
      onSelectAction={actions.selectAction}
      onSubmitSelectedAction={() => {
        void actions.submitSelectedAction();
      }}
      onUsdAmountInputChange={actions.setUsdAmountInput}
      selectedAction={actions.selectedAction}
      submittedHash={actions.submittedHash}
      usdAmountInput={actions.usdAmountInput}
    />
  );
}
