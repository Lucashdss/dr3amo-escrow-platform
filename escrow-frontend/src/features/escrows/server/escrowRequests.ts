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
  fieldName: "clientWalletAddress" | "freelancerWalletAddress"
): ValidationResult<string> {
  const normalizedValue = normalizeWalletAddress(value);

  if (!isAddress(normalizedValue)) {
    return createValidationError(`A valid ${fieldName} is required.`);
  }

  return createValidationSuccess(normalizedValue);
}

function parseContractAddress(value: string): ValidationResult<string> {
  if (!isAddress(value)) {
    return createValidationError("A valid contractAddress is required.");
  }

  return createValidationSuccess(value);
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

export function parseCreateEscrowRequest(
  body: unknown
): ValidationResult<CreateEscrowRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const payload = body as Record<string, unknown>;
  const chainKey = parseChainKey(payload.chainKey);
  const contractAddress = getRequiredString(
    payload,
    "contractAddress",
    "A valid contractAddress is required."
  );
  const escrowName = getRequiredString(
    payload,
    "escrowName",
    "escrowName is required."
  );
  const clientWalletAddress = getRequiredString(
    payload,
    "clientWalletAddress",
    "A valid clientWalletAddress is required."
  );
  const freelancerWalletAddress = getRequiredString(
    payload,
    "freelancerWalletAddress",
    "A valid freelancerWalletAddress is required."
  );
  const tokenSymbol = parseTokenSymbol(payload.tokenSymbol);
  const deadline = getRequiredString(payload, "deadline", "deadline is required.");
  const amount = getRequiredString(payload, "amount", "amount is required.");
  const state = getRequiredString(payload, "state", "state is required.");
  const txHash = getRequiredString(payload, "txHash", "txHash is required.");

  if (!chainKey.success) {
    return chainKey;
  }

  if (!contractAddress.success) {
    return contractAddress;
  }

  if (!escrowName.success) {
    return escrowName;
  }

  if (!clientWalletAddress.success) {
    return clientWalletAddress;
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

  if (!amount.success) {
    return amount;
  }

  if (!state.success) {
    return state;
  }

  if (!txHash.success) {
    return txHash;
  }

  const parsedContractAddress = parseContractAddress(contractAddress.data);
  const parsedEscrowName = parseEscrowName(escrowName.data);
  const parsedClientWallet = parseWalletAddress(
    clientWalletAddress.data,
    "clientWalletAddress"
  );
  const parsedFreelancerWallet = parseWalletAddress(
    freelancerWalletAddress.data,
    "freelancerWalletAddress"
  );

  if (!parsedContractAddress.success) {
    return parsedContractAddress;
  }

  if (!parsedEscrowName.success) {
    return parsedEscrowName;
  }

  if (!parsedClientWallet.success) {
    return parsedClientWallet;
  }

  if (!parsedFreelancerWallet.success) {
    return parsedFreelancerWallet;
  }

  return createValidationSuccess({
    amount: amount.data,
    chainKey: chainKey.data,
    clientWalletAddress: parsedClientWallet.data,
    contractAddress: parsedContractAddress.data,
    deadline: deadline.data,
    escrowName: parsedEscrowName.data,
    freelancerWalletAddress: parsedFreelancerWallet.data,
    state: state.data,
    tokenSymbol: tokenSymbol.data,
    txHash: txHash.data,
  });
}

export function parseEscrowManagementRequest(
  request: Request
): ValidationResult<number> {
  return parsePositiveIntegerQueryParam(request, "userId");
}

export function parseEscrowManagementDetailRequest(
  request: Request,
  id: string
): ValidationResult<{
  id: number;
  userId: number;
}> {
  const userId = parsePositiveIntegerQueryParam(request, "userId");
  const escrowId = parseEscrowId(id);

  if (!userId.success) {
    return userId;
  }

  if (!escrowId.success) {
    return escrowId;
  }

  return createValidationSuccess({
    id: escrowId.data,
    userId: userId.data,
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
  const userId = parsePositiveInteger(payload.userId, "userId");

  if (!action.success) {
    return action;
  }

  if (!txHash.success) {
    return txHash;
  }

  if (!userId.success) {
    return userId;
  }

  return createValidationSuccess({
    action: action.data,
    txHash: txHash.data,
    userId: userId.data,
  });
}

export function parseClientEscrowFundsRequest(
  request: Request
): ValidationResult<number> {
  return parsePositiveIntegerQueryParam(request, "clientId");
}

function parsePositiveIntegerQueryParam(
  request: Request,
  key: "clientId" | "freelancerId" | "userId"
): ValidationResult<number> {
  const value = new URL(request.url).searchParams.get(key);
  const parsedValue = Number.parseInt(value ?? "", 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return createValidationError(`${key} query param must be a positive integer.`);
  }

  return createValidationSuccess(parsedValue);
}

function parsePositiveInteger(
  value: unknown,
  key: "userId"
): ValidationResult<number> {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return createValidationError(`${key} must be a positive integer.`);
  }

  return createValidationSuccess(parsedValue);
}

export function parseFreelancerEscrowFundsRequest(
  request: Request
): ValidationResult<number> {
  return parsePositiveIntegerQueryParam(request, "freelancerId");
}
