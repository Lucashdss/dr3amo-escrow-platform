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
  formatDateOnlyUtc,
  getStartOfTodayUtc,
  hasMaxLength,
  parseDateOnlyUtc,
  type ValidationResult,
} from "@/lib/validation";

export const CHAIN_OPTIONS = ESCROW_CHAIN_KEYS;
export const TOKEN_OPTIONS = TOKEN_SYMBOLS;
export const MAX_ESCROW_NAME_LENGTH = 50;
export const MAX_MODIFICATION_EXTENSION_DAYS = 183;

export type EscrowSubmissionInput = {
  clientUser: UserRecord | null;
  deadline: string;
  escrowName: string;
  isConnected: boolean;
  isWrongNetwork: boolean;
  selectedChain: EscrowChainKey;
  upfrontPercentage: string;
  walletAddress?: string;
};

export function validateEscrowName(value: string): ValidationResult<string> {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return createValidationError("Contract name is required.");
  }

  if (!hasMaxLength(trimmedValue, MAX_ESCROW_NAME_LENGTH)) {
    return createValidationError(
      `Contract name must be ${MAX_ESCROW_NAME_LENGTH} characters or fewer.`
    );
  }

  return createValidationSuccess(trimmedValue);
}

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
  const selectedDate = parseDateOnlyUtc(deadline);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  if (!selectedDate) {
    return null;
  }

  return Math.round(
    (selectedDate.getTime() - getStartOfTodayUtc(now).getTime()) / millisecondsPerDay
  );
}

export function validateEscrowDeadline(
  deadline: string,
  now = new Date()
): ValidationResult<string> {
  const parsedDeadline = parseDateOnlyUtc(deadline);
  const deliveryDays = calculateDeliveryDays(deadline, now);

  if (!parsedDeadline) {
    return createValidationError("deadline must use YYYY-MM-DD format.");
  }

  if (deliveryDays === null || deliveryDays <= 0) {
    return createValidationError("deadline must be a future date.");
  }

  return createValidationSuccess(formatDateOnlyUtc(parsedDeadline));
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
): ValidationResult<{
  deliveryDays: number;
  escrowName: string;
  upfrontPercentage: number;
}> {
  if (!input.walletAddress || !input.isConnected) {
    return createValidationError("Connect your wallet before creating an escrow.");
  }

  if (!input.clientUser) {
    return createValidationError(
      "Your connected wallet must be linked to a registered buyer user."
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

  const escrowName = validateEscrowName(input.escrowName);

  if (!escrowName.success) {
    return escrowName;
  }

  const upfrontPercentage = parseUpfrontPercentage(input.upfrontPercentage);

  if (upfrontPercentage === null) {
    return createValidationError(
      "Upfront payment percentage must be a whole number from 0 to 100."
    );
  }

  const deliveryDays = calculateDeliveryDays(input.deadline);

  if (deliveryDays === null) {
    return createValidationError("Use a YYYY-MM-DD deadline.");
  }

  if (deliveryDays <= 0) {
    return createValidationError(
      "Select a future deadline to derive the delivery period."
    );
  }

  return createValidationSuccess({
    deliveryDays,
    escrowName: escrowName.data,
    upfrontPercentage,
  });
}
