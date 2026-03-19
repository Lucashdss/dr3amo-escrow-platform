import type { Address } from "viem";

import { ESCROW_DEPLOYMENT_CONFIGS, ETH_ZERO_ADDRESS } from "@/features/escrows/config/deployment";
import type { UserRecord } from "@/features/auth/types/user";
import {
  ESCROW_CHAIN_KEYS,
  TOKEN_SYMBOLS,
  type EscrowChainKey,
  type TokenSymbol,
} from "@/features/escrows/types/escrow";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";

export const CHAIN_OPTIONS = ESCROW_CHAIN_KEYS;
export const TOKEN_OPTIONS = TOKEN_SYMBOLS;

export type EscrowSubmissionInput = {
  clientUser: UserRecord | null;
  deadline: string;
  isConnected: boolean;
  isWrongNetwork: boolean;
  selectedChain: EscrowChainKey;
  upfrontPercentage: string;
  walletAddress?: string;
};

export function parseUpfrontPercentage(value: string): number | null {
  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const percentage = Number.parseInt(trimmedValue, 10);
  return percentage >= 0 && percentage <= 100 ? percentage : null;
}

export function percentToBps(percentage: number): number {
  return percentage * 100;
}

export function calculateDeliveryDays(
  deadline: string,
  now = new Date()
): number | null {
  if (!deadline) {
    return null;
  }

  const selectedDate = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return null;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (selectedDate.getTime() - startOfToday.getTime()) / millisecondsPerDay
  );
}

export function getTokenAddress(
  tokenSymbol: TokenSymbol,
  chainKey: EscrowChainKey
): Address {
  if (tokenSymbol === "ETH") {
    return ETH_ZERO_ADDRESS;
  }

  return ESCROW_DEPLOYMENT_CONFIGS[chainKey].usdcAddress;
}

export function getEscrowErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function validateEscrowSubmission(
  input: EscrowSubmissionInput
): ValidationResult<{ deliveryDays: number; upfrontPercentage: number }> {
  if (!input.walletAddress || !input.isConnected) {
    return createValidationError("Connect your wallet before creating an escrow.");
  }

  if (!input.clientUser) {
    return createValidationError(
      "Your connected wallet must be linked to a registered client user."
    );
  }

  if (!ESCROW_DEPLOYMENT_CONFIGS[input.selectedChain].factoryAddress) {
    return createValidationError(
      "Set NEXT_PUBLIC_FACTORY_BASE_SEPOLIA_ADDRESS before testing on Base Sepolia."
    );
  }

  if (input.isWrongNetwork) {
    return createValidationError(
      `Switch your wallet to ${ESCROW_DEPLOYMENT_CONFIGS[input.selectedChain].displayName} before submitting.`
    );
  }

  const upfrontPercentage = parseUpfrontPercentage(input.upfrontPercentage);

  if (upfrontPercentage === null) {
    return createValidationError(
      "Upfront payment percentage must be a whole number from 0 to 100."
    );
  }

  const deliveryDays = calculateDeliveryDays(input.deadline);

  if (!deliveryDays || deliveryDays <= 0) {
    return createValidationError(
      "Select a future deadline to derive the delivery period."
    );
  }

  return createValidationSuccess({ deliveryDays, upfrontPercentage });
}
