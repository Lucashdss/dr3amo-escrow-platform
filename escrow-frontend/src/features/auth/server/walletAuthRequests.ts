import { isAddress } from "viem";

import { normalizeWalletAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";
import type {
  CreateWalletNonceRequest,
  VerifyWalletSignatureRequest,
} from "@/features/auth/types/auth";

function getNumberField(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function getStringField(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseWalletAddress(value: unknown): ValidationResult<string> {
  const walletAddress = normalizeWalletAddress(getStringField(value) ?? "");

  if (!walletAddress) {
    return createValidationError("walletAddress is required.");
  }

  if (!isAddress(walletAddress)) {
    return createValidationError("walletAddress is invalid.");
  }

  return createValidationSuccess(walletAddress);
}

export function parseCreateWalletNonceRequest(
  body: unknown
): ValidationResult<CreateWalletNonceRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const walletAddress = parseWalletAddress(
    (body as { walletAddress?: unknown }).walletAddress
  );

  if (!walletAddress.success) {
    return walletAddress;
  }

  return createValidationSuccess({ walletAddress: walletAddress.data });
}

export function parseVerifyWalletSignatureRequest(
  body: unknown
): ValidationResult<VerifyWalletSignatureRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const challengeId = getNumberField((body as { challengeId?: unknown }).challengeId);
  const signature = getStringField((body as { signature?: unknown }).signature);
  const walletAddress = parseWalletAddress(
    (body as { walletAddress?: unknown }).walletAddress
  );

  if (challengeId === null) {
    return createValidationError("challengeId is required.");
  }

  if (!signature?.trim()) {
    return createValidationError("signature is required.");
  }

  if (!walletAddress.success) {
    return walletAddress;
  }

  return createValidationSuccess({
    challengeId,
    signature: signature.trim(),
    walletAddress: walletAddress.data,
  });
}
