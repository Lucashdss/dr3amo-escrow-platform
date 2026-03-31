import { isAddress } from "viem";

import { normalizeWalletAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";
import {
  ESCROW_CHAIN_KEYS,
  ESCROW_ACTION_KEYS,
  TOKEN_SYMBOLS,
  type CreateEscrowRequest,
  type EscrowActionKey,
  type EscrowChainKey,
  type SyncEscrowActionRequest,
  type TokenSymbol,
} from "@/features/escrows/types/escrow";

function getRequiredString(
  body: Record<string, unknown>,
  key: keyof CreateEscrowRequest,
  message: string
): ValidationResult<string> {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    return createValidationError(message);
  }

  return createValidationSuccess(value.trim());
}

function parseChainKey(value: unknown): ValidationResult<EscrowChainKey> {
  if (
    typeof value !== "string" ||
    !ESCROW_CHAIN_KEYS.includes(value as EscrowChainKey)
  ) {
    return createValidationError("chainKey must be base or baseSepolia.");
  }

  return createValidationSuccess(value as EscrowChainKey);
}

function parseTokenSymbol(value: unknown): ValidationResult<TokenSymbol> {
  if (typeof value !== "string" || !TOKEN_SYMBOLS.includes(value as TokenSymbol)) {
    return createValidationError("tokenSymbol must be ETH or USDC.");
  }

  return createValidationSuccess(value as TokenSymbol);
}

function parseWalletAddress(
  value: string,
  fieldName: "freelancerWalletAddress"
): ValidationResult<string> {
  const normalizedValue = normalizeWalletAddress(value);

  if (!isAddress(normalizedValue)) {
    return createValidationError(`A valid ${fieldName} is required.`);
  }

  return createValidationSuccess(normalizedValue);
}

function parseEscrowName(value: string): ValidationResult<string> {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return createValidationError("escrowName is required.");
  }

  if (trimmedValue.length > 50) {
    return createValidationError("escrowName must be 50 characters or fewer.");
  }

  return createValidationSuccess(trimmedValue);
}

function parseEscrowId(value: string): ValidationResult<number> {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return createValidationError("id must be a positive integer.");
  }

  return createValidationSuccess(parsedValue);
}

function parseTxHash(value: unknown): ValidationResult<string> {
  if (
    typeof value !== "string" ||
    !/^0x[a-fA-F0-9]{64}$/.test(value.trim())
  ) {
    return createValidationError("A valid txHash is required.");
  }

  return createValidationSuccess(value.trim());
}

function parseEscrowAction(value: unknown): ValidationResult<EscrowActionKey> {
  if (
    typeof value !== "string" ||
    !ESCROW_ACTION_KEYS.includes(value as EscrowActionKey)
  ) {
    return createValidationError("A valid action is required.");
  }

  return createValidationSuccess(value as EscrowActionKey);
}

function hasRemovedCreateFields(
  payload: Record<string, unknown>
): ValidationResult<null> {
  const removedFields = ["contractAddress", "amount", "state"];
  const hasRemovedField = removedFields.some((field) => field in payload);

  if (hasRemovedField) {
    return createValidationError(
      "contractAddress, amount, and state are derived from chain data."
    );
  }

  return createValidationSuccess(null);
}

export function parseCreateEscrowRequest(
  body: unknown
): ValidationResult<CreateEscrowRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const payload = body as Record<string, unknown>;
  const chainKey = parseChainKey(payload.chainKey);
  const escrowName = getRequiredString(
    payload,
    "escrowName",
    "escrowName is required."
  );
  const freelancerWalletAddress = getRequiredString(
    payload,
    "freelancerWalletAddress",
    "A valid freelancerWalletAddress is required."
  );
  const tokenSymbol = parseTokenSymbol(payload.tokenSymbol);
  const deadline = getRequiredString(payload, "deadline", "deadline is required.");
  const txHash = parseTxHash(payload.txHash);
  const removedFields = hasRemovedCreateFields(payload);

  if (!chainKey.success) {
    return chainKey;
  }

  if (!escrowName.success) {
    return escrowName;
  }

  if (!freelancerWalletAddress.success) {
    return freelancerWalletAddress;
  }

  if (!tokenSymbol.success) {
    return tokenSymbol;
  }

  if (!deadline.success) {
    return deadline;
  }

  if (!txHash.success) {
    return txHash;
  }

  if (!removedFields.success) {
    return removedFields;
  }

  const parsedEscrowName = parseEscrowName(escrowName.data);
  const parsedFreelancerWallet = parseWalletAddress(
    freelancerWalletAddress.data,
    "freelancerWalletAddress"
  );

  if (!parsedEscrowName.success) {
    return parsedEscrowName;
  }

  if (!parsedFreelancerWallet.success) {
    return parsedFreelancerWallet;
  }

  return createValidationSuccess({
    chainKey: chainKey.data,
    deadline: deadline.data,
    escrowName: parsedEscrowName.data,
    freelancerWalletAddress: parsedFreelancerWallet.data,
    tokenSymbol: tokenSymbol.data,
    txHash: txHash.data,
  });
}

export function parseEscrowManagementRequest(
  _request: Request
): ValidationResult<null> {
  return createValidationSuccess(null);
}

export function parseEscrowManagementDetailRequest(
  _request: Request,
  id: string
): ValidationResult<{
  id: number;
}> {
  const escrowId = parseEscrowId(id);

  if (!escrowId.success) {
    return escrowId;
  }

  return createValidationSuccess({
    id: escrowId.data,
  });
}

export function parseEscrowRouteId(id: string): ValidationResult<number> {
  return parseEscrowId(id);
}

export function parseEscrowSyncRequest(
  body: unknown
): ValidationResult<SyncEscrowActionRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const payload = body as Record<string, unknown>;
  const action = parseEscrowAction(payload.action);
  const txHash = parseTxHash(payload.txHash);

  if (!action.success) {
    return action;
  }

  if (!txHash.success) {
    return txHash;
  }

  return createValidationSuccess({
    action: action.data,
    txHash: txHash.data,
  });
}

export function parseClientEscrowFundsRequest(
  _request: Request
): ValidationResult<null> {
  return createValidationSuccess(null);
}

export function parseFreelancerEscrowFundsRequest(
  _request: Request
): ValidationResult<null> {
  return createValidationSuccess(null);
}
