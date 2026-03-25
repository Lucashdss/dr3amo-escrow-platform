import { formatUnits, parseUnits } from "viem";

import {
  ESCROW_ROLE_ACTIONS,
  ESCROW_TERMINAL_STATES,
  getEscrowActionDefinition,
} from "@/features/escrows/config/escrowContract";
import type {
  EscrowActionAvailability,
  EscrowActionKey,
  EscrowLiveState,
  EscrowLiveSnapshot,
  EscrowManagementItem,
} from "@/features/escrows/types/escrow";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";

type DeriveEscrowActionsInput = {
  escrow: EscrowManagementItem;
  liveEscrowState: EscrowLiveState | null;
  liveSnapshot: EscrowLiveSnapshot | null;
};

type ActionParameterInput = {
  action: EscrowActionKey;
  amount: string;
  deadlineExtensionDays: string;
  tokenId: number;
  usdAmount: string;
};

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

function isTerminalState(state: string): boolean {
  return ESCROW_TERMINAL_STATES.includes(normalizeState(state) as never);
}

function isUsdcToken(tokenId: number): boolean {
  return tokenId === 1 || tokenId === 2;
}

function isEthToken(tokenId: number): boolean {
  return tokenId === 3;
}

function getTokenDecimals(tokenId: number): number {
  if (isUsdcToken(tokenId)) {
    return 6;
  }

  if (isEthToken(tokenId)) {
    return 18;
  }

  return 18;
}

function isPositiveWholeNumber(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number.parseInt(value.trim(), 10) > 0;
}

function createDisabledAction(
  actionKey: EscrowActionKey,
  disabled: boolean,
  disabledReason: string | null
): EscrowActionAvailability {
  return {
    ...getEscrowActionDefinition(actionKey),
    disabled,
    disabledReason,
  };
}

export function deriveEscrowActionAvailability(
  input: DeriveEscrowActionsInput
): EscrowActionAvailability[] {
  const dbState = normalizeState(input.escrow.state);
  const liveState = input.liveEscrowState ?? dbState;
  const modificationsRequested = input.liveSnapshot?.modificationsRequested ?? null;

  return ESCROW_ROLE_ACTIONS[input.escrow.role].map((actionKey) => {
    if (actionKey === "cancelEscrow") {
      const disabled = normalizeState(liveState) !== "created";

      return createDisabledAction(
        actionKey,
        disabled,
        disabled ? "Escrow can only be canceled while still created." : null
      );
    }

    if (actionKey === "setMinimumPriceUSD") {
      return createDisabledAction(
        actionKey,
        dbState !== "created",
        dbState !== "created"
          ? "Minimum price can only be set before funding."
          : null
      );
    }

    if (actionKey === "fund") {
      const disabled = ["canceled", "dispute", "refunded", "released"].includes(
        normalizeState(liveState)
      );

      return createDisabledAction(
        actionKey,
        disabled,
        disabled ? "Funding is unavailable in the current contract state." : null
      );
    }

    if (actionKey === "markWorkSubmitted") {
      const disabled = dbState !== "funded" && dbState !== "pending modification";

      return createDisabledAction(
        actionKey,
        disabled,
        disabled ? "Work can be submitted only after funding or modification." : null
      );
    }

    if (actionKey === "confirmDelivery") {
      const disabled = dbState !== "work submitted";

      return createDisabledAction(
        actionKey,
        disabled,
        disabled ? "Delivery can only be confirmed after work submission." : null
      );
    }

    if (actionKey === "requestModificationAndUpdateDeadline") {
      const hasValidState =
        dbState === "work submitted" || dbState === "pending modification";
      const maxModificationsReached =
        modificationsRequested !== null && modificationsRequested >= 2;
      const disabled = !hasValidState || maxModificationsReached;
      let disabledReason: string | null = null;

      if (!hasValidState) {
        disabledReason =
          "Modifications can be requested only after work submission.";
      } else if (maxModificationsReached) {
        disabledReason = "The contract has already reached the modification limit.";
      }

      return createDisabledAction(actionKey, disabled, disabledReason);
    }

    if (actionKey === "initiateDispute") {
      const disabled = isTerminalState(dbState);

      return createDisabledAction(
        actionKey,
        disabled,
        disabled ? "Disputes are unavailable for terminal contracts." : null
      );
    }

    return createDisabledAction(actionKey, false, null);
  });
}

export function parseFundAmount(amount: string, tokenId: number): bigint | null {
  const trimmedAmount = amount.trim();

  if (!trimmedAmount) {
    return null;
  }

  try {
    return parseUnits(trimmedAmount, getTokenDecimals(tokenId));
  } catch {
    return null;
  }
}

export function parseMinimumPriceUsdAmount(value: string): bigint | null {
  const trimmedValue = value.trim();

  if (!isPositiveWholeNumber(trimmedValue)) {
    return null;
  }

  return BigInt(trimmedValue);
}

export function parseModificationExtensionDays(value: string): bigint | null {
  const trimmedValue = value.trim();

  if (!isPositiveWholeNumber(trimmedValue)) {
    return null;
  }

  return BigInt(trimmedValue);
}

export function validateEscrowActionInput(
  input: ActionParameterInput
): ValidationResult<bigint | null> {
  if (input.action === "fund") {
    const parsedAmount = parseFundAmount(input.amount, input.tokenId);

    if (parsedAmount === null) {
      return createValidationError("Enter a valid funding amount.");
    }

    return createValidationSuccess(parsedAmount);
  }

  if (input.action === "setMinimumPriceUSD") {
    const parsedUsdAmount = parseMinimumPriceUsdAmount(input.usdAmount);

    if (parsedUsdAmount === null) {
      return createValidationError("Enter a valid whole-number USD amount.");
    }

    return createValidationSuccess(parsedUsdAmount);
  }

  if (input.action === "requestModificationAndUpdateDeadline") {
    const parsedDays = parseModificationExtensionDays(input.deadlineExtensionDays);

    if (parsedDays === null) {
      return createValidationError("Enter a valid whole-number day extension.");
    }

    return createValidationSuccess(parsedDays);
  }

  return createValidationSuccess<bigint | null>(null);
}

export function formatMinimumPriceValue(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  try {
    const formattedValue = formatUnits(BigInt(value), 18);
    return formattedValue === "0" ? "Not set" : formattedValue;
  } catch {
    return value;
  }
}
