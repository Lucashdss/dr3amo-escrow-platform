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
import { MAX_MODIFICATION_EXTENSION_DAYS } from "@/features/escrows/services/validation";

type DeriveEscrowActionsInput = {
  escrow: EscrowManagementItem;
  liveEscrowState: EscrowLiveState | null;
  liveSnapshot: EscrowLiveSnapshot | null;
};

type ActionAvailabilityContext = {
  dbState: string;
  liveState: string;
  modificationsRequested: number | null;
};

type ActionParameterInput = {
  action: EscrowActionKey;
  amount: string;
  deadlineExtensionDays: string;
  tokenId: number;
  usdAmount: string;
};

const MAX_ETH_FUND_AMOUNT = "1000";
const MAX_USDC_FUND_AMOUNT = "1000000";
const MAX_MINIMUM_PRICE_USD = BigInt(1000000);

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

function getMaxFundAmount(tokenId: number): bigint {
  const maxAmount = isUsdcToken(tokenId)
    ? MAX_USDC_FUND_AMOUNT
    : MAX_ETH_FUND_AMOUNT;

  return parseUnits(maxAmount, getTokenDecimals(tokenId));
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
  const context = createActionAvailabilityContext(input);

  return ESCROW_ROLE_ACTIONS[input.escrow.role].map((actionKey) =>
    deriveActionAvailability(actionKey, context)
  );
}

function createActionAvailabilityContext(
  input: DeriveEscrowActionsInput
): ActionAvailabilityContext {
  const dbState = normalizeState(input.escrow.state);

  return {
    dbState,
    liveState: normalizeState(input.liveEscrowState ?? dbState),
    modificationsRequested: input.liveSnapshot?.modificationsRequested ?? null,
  };
}

function deriveActionAvailability(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  switch (actionKey) {
    case "cancelEscrow":
      return createCancelEscrowAction(actionKey, context);
    case "setMinimumPriceUSD":
      return createMinimumPriceAction(actionKey, context);
    case "fund":
      return createFundAction(actionKey, context);
    case "markWorkSubmitted":
      return createMarkWorkSubmittedAction(actionKey, context);
    case "confirmDelivery":
      return createConfirmDeliveryAction(actionKey, context);
    case "requestModificationAndUpdateDeadline":
      return createRequestModificationAction(actionKey, context);
    case "initiateDispute":
      return createInitiateDisputeAction(actionKey, context);
    default:
      return createDisabledAction(actionKey, false, null);
  }
}

function createCancelEscrowAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled = context.liveState !== "created";

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Escrow can only be canceled while still created." : null
  );
}

function createMinimumPriceAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled = context.dbState !== "created";

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Minimum price can only be set before funding." : null
  );
}

function createFundAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled = ["canceled", "dispute", "refunded", "released"].includes(
    context.liveState
  );

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Funding is unavailable in the current contract state." : null
  );
}

function createMarkWorkSubmittedAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled =
    context.dbState !== "funded" && context.dbState !== "pending modification";

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Work can be submitted only after funding or modification." : null
  );
}

function createConfirmDeliveryAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled = context.dbState !== "work submitted";

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Delivery can only be confirmed after work submission." : null
  );
}

function createRequestModificationAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabledReason = getModificationDisabledReason(context);

  return createDisabledAction(actionKey, disabledReason !== null, disabledReason);
}

function getModificationDisabledReason(
  context: ActionAvailabilityContext
): string | null {
  const hasValidState =
    context.dbState === "work submitted" ||
    context.dbState === "pending modification";
  const maxModificationsReached =
    context.modificationsRequested !== null &&
    context.modificationsRequested >= 2;
  let disabledReason: string | null = null;

  if (!hasValidState) {
    disabledReason =
      "Modifications can be requested only after work submission.";
  } else if (maxModificationsReached) {
    disabledReason = "The contract has already reached the modification limit.";
  }

  return disabledReason;
}

function createInitiateDisputeAction(
  actionKey: EscrowActionKey,
  context: ActionAvailabilityContext
): EscrowActionAvailability {
  const disabled = isTerminalState(context.dbState);

  return createDisabledAction(
    actionKey,
    disabled,
    disabled ? "Disputes are unavailable for terminal contracts." : null
  );
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
  const parsedDays = parsePositiveWholeNumberAmount(value);

  return parsedDays;
}

export function validateEscrowActionInput(
  input: ActionParameterInput
): ValidationResult<bigint | null> {
  switch (input.action) {
    case "fund":
      return validateFundActionInput(input);
    case "setMinimumPriceUSD":
      return validateMinimumPriceActionInput(input);
    case "requestModificationAndUpdateDeadline":
      return validateModificationRequestInput(input);
    default:
      return createValidationSuccess<bigint | null>(null);
  }
}

function validateFundActionInput(
  input: ActionParameterInput
): ValidationResult<bigint | null> {
  const parsedAmount = parseFundAmount(input.amount, input.tokenId);

  if (parsedAmount === null) {
    return createValidationError("Enter a valid funding amount.");
  }

  if (parsedAmount <= BigInt(0)) {
    return createValidationError("Funding amount must be greater than zero.");
  }

  if (parsedAmount > getMaxFundAmount(input.tokenId)) {
    return createValidationError("Funding amount exceeds the allowed maximum.");
  }

  return createValidationSuccess(parsedAmount);
}

function parsePositiveWholeNumberAmount(value: string): bigint | null {
  const trimmedValue = value.trim();

  if (!isPositiveWholeNumber(trimmedValue)) {
    return null;
  }

  return BigInt(trimmedValue);
}

function validateMinimumPriceActionInput(
  input: ActionParameterInput
): ValidationResult<bigint | null> {
  const parsedUsdAmount = parseMinimumPriceUsdAmount(input.usdAmount);

  if (parsedUsdAmount === null) {
    return createValidationError("Enter a valid whole-number USD amount.");
  }

  if (parsedUsdAmount > MAX_MINIMUM_PRICE_USD) {
    return createValidationError("Minimum price exceeds the allowed maximum.");
  }

  return createValidationSuccess(parsedUsdAmount);
}

function validateModificationRequestInput(
  input: ActionParameterInput
): ValidationResult<bigint | null> {
  const parsedDays = parseModificationExtensionDays(input.deadlineExtensionDays);

  if (parsedDays === null) {
    return createValidationError("Enter a valid whole-number day extension.");
  }

  if (parsedDays > BigInt(MAX_MODIFICATION_EXTENSION_DAYS)) {
    return createValidationError("Deadline extension exceeds the allowed maximum.");
  }

  return createValidationSuccess(parsedDays);
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
