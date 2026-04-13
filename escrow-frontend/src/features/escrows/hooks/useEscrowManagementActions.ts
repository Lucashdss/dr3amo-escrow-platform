"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import { getProductionEscrowActionDisabledReason } from "@/features/escrows/config/environment";
import {
  deriveEscrowActionAvailability,
  validateEscrowActionInput,
} from "@/features/escrows/services/escrowActions";
import {
  approveEscrowFundingIfNeeded,
  executeEscrowAction,
  getSupportedChainIdForEscrow,
  getEscrowTokenSymbol,
  waitForEscrowActionReceipt,
} from "@/features/escrows/services/escrowContract";
import { syncEscrowManagementAction } from "@/features/escrows/services/escrowApi";
import { getEscrowErrorMessage } from "@/features/escrows/services/validation";
import type {
  EscrowActionAvailability,
  EscrowActionKey,
  EscrowLiveSnapshot,
  EscrowLiveState,
  EscrowManagementItem,
} from "@/features/escrows/types/escrow";

type UseEscrowManagementActionsInput = {
  escrow: EscrowManagementItem | null;
  liveEscrowState: EscrowLiveState | null;
  liveSnapshot: EscrowLiveSnapshot | null;
  refreshDetail: () => Promise<void>;
  refreshLiveEscrowState: () => Promise<void>;
};

type UseEscrowManagementActionsResult = {
  actionError: string | null;
  actionStatus: string | null;
  actionSuccess: string | null;
  actions: EscrowActionAvailability[];
  amountInput: string;
  deadlineExtensionInput: string;
  isActionMenuOpen: boolean;
  isExecuting: boolean;
  openActionMenu: () => Promise<void>;
  selectedAction: EscrowActionKey | null;
  selectAction: (action: EscrowActionKey) => void;
  setAmountInput: (value: string) => void;
  setDeadlineExtensionInput: (value: string) => void;
  setUsdAmountInput: (value: string) => void;
  submittedHash: string | null;
  usdAmountInput: string;
  closeActionMenu: () => void;
  closeSelectedAction: () => void;
  submitSelectedAction: () => Promise<void>;
};

function isStateLikeError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("state") ||
    normalizedMessage.includes("funded") ||
    normalizedMessage.includes("released") ||
    normalizedMessage.includes("refunded") ||
    normalizedMessage.includes("dispute") ||
    normalizedMessage.includes("cancel")
  );
}

export function useEscrowManagementActions(
  input: UseEscrowManagementActionsInput
): UseEscrowManagementActionsResult {
  const account = useAccount();
  const [selectedAction, setSelectedAction] = useState<EscrowActionKey | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [usdAmountInput, setUsdAmountInput] = useState("");
  const [deadlineExtensionInput, setDeadlineExtensionInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const actions = input.escrow
    ? deriveEscrowActionAvailability({
        escrow: input.escrow,
        liveEscrowState: input.liveEscrowState,
        liveSnapshot: input.liveSnapshot,
      })
    : [];

  async function openActionMenu(): Promise<void> {
    setActionError(null);
    setActionStatus(null);
    setActionSuccess(null);
    setIsActionMenuOpen(true);

    if (input.escrow?.role === "client") {
      await input.refreshLiveEscrowState();
    }
  }

  function closeActionMenu(): void {
    setIsActionMenuOpen(false);
  }

  function closeSelectedAction(): void {
    setSelectedAction(null);
    setActionError(null);
    setActionStatus(null);
    setActionSuccess(null);
  }

  function selectAction(action: EscrowActionKey): void {
    setSelectedAction(action);
    setAmountInput("");
    setUsdAmountInput("");
    setDeadlineExtensionInput("");
    setActionError(null);
    setActionStatus(null);
    setActionSuccess(null);
  }

  async function approveFundingIfNeeded(amount: bigint): Promise<void> {
    if (!input.escrow || !account.address) {
      return;
    }

    if (getEscrowTokenSymbol(input.escrow.tokenId) === "ETH") {
      return;
    }

    setActionStatus("Approve USDC in your wallet...");
    await approveEscrowFundingIfNeeded({
      amount,
      contractAddress: input.escrow.contractAddress,
      databaseChainId: input.escrow.chainId,
      tokenAddress: input.escrow.tokenAddress,
      tokenId: input.escrow.tokenId,
      walletAddress: account.address,
    });
  }

  async function submitSelectedAction(): Promise<void> {
    if (!input.escrow || !selectedAction) {
      setActionError("Escrow detail is not ready.");
      return;
    }

    const productionDisabledReason =
      getProductionEscrowActionDisabledReason(selectedAction);

    if (productionDisabledReason) {
      setActionError(productionDisabledReason);
      return;
    }

    if (!account.isConnected || !account.address) {
      setActionError("Connect your wallet before executing an escrow action.");
      return;
    }

    if (account.chainId !== getSupportedChainIdForEscrow(input.escrow.chainId)) {
      setActionError("Switch your wallet to the escrow network before submitting.");
      return;
    }

    const validation = validateEscrowActionInput({
      action: selectedAction,
      amount: amountInput,
      deadlineExtensionDays: deadlineExtensionInput,
      tokenId: input.escrow.tokenId,
      usdAmount: usdAmountInput,
    });

    if (!validation.success) {
      setActionError(validation.error);
      return;
    }

    setIsExecuting(true);
    setActionError(null);
    setActionStatus(null);
    setActionSuccess(null);
    setSubmittedHash(null);

    try {
      if (selectedAction === "fund" && validation.data !== null) {
        await approveFundingIfNeeded(validation.data);
        setActionStatus("Funding escrow...");
      }

      const execution = await executeEscrowAction({
        action: selectedAction,
        amount: selectedAction === "fund" ? validation.data : null,
        contractAddress: input.escrow.contractAddress,
        databaseChainId: input.escrow.chainId,
        deadlineExtensionDays:
          selectedAction === "requestModificationAndUpdateDeadline"
            ? validation.data
            : null,
        tokenId: input.escrow.tokenId,
        usdAmount: selectedAction === "setMinimumPriceUSD" ? validation.data : null,
      });

      setSubmittedHash(execution.txHash);
      await waitForEscrowActionReceipt(input.escrow.chainId, execution.txHash);
      await syncEscrowManagementAction(input.escrow.id, {
        action: selectedAction,
        txHash: execution.txHash,
      });
      await input.refreshDetail();
      setActionStatus(null);
      setActionSuccess("Escrow action confirmed and synced.");
    } catch (error) {
      setActionStatus(null);
      const message = getEscrowErrorMessage(error, "Failed to execute escrow action.");
      setActionError(message);

      if (selectedAction === "fund" || isStateLikeError(message)) {
        await input.refreshLiveEscrowState();
      }
    } finally {
      setIsExecuting(false);
    }
  }

  return {
    actionError,
    actionStatus,
    actionSuccess,
    actions,
    amountInput,
    closeActionMenu,
    closeSelectedAction,
    deadlineExtensionInput,
    isActionMenuOpen,
    isExecuting,
    openActionMenu,
    selectAction,
    selectedAction,
    setAmountInput,
    setDeadlineExtensionInput,
    setUsdAmountInput,
    submitSelectedAction,
    submittedHash,
    usdAmountInput,
  };
}
