import { isAddress } from "viem";

import { normalizeWalletAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";
import {
  ESCROW_CHAIN_KEYS,
  TOKEN_SYMBOLS,
  type CreateEscrowRequest,
  type EscrowChainKey,
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
    freelancerWalletAddress: parsedFreelancerWallet.data,
    state: state.data,
    tokenSymbol: tokenSymbol.data,
    txHash: txHash.data,
  });
}

export function parseClientEscrowFundsRequest(
  request: Request
): ValidationResult<number> {
  const clientIdValue = new URL(request.url).searchParams.get("clientId");
  const clientId = Number.parseInt(clientIdValue ?? "", 10);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return createValidationError("clientId query param must be a positive integer.");
  }

  return createValidationSuccess(clientId);
}
