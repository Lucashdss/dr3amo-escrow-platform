import { normalizeUsername, normalizeWalletAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";
import type { CreateUserRequest } from "@/features/auth/types/user";

function getStringField(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseCreateUserRequest(
  body: unknown
): ValidationResult<CreateUserRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const walletValue = getStringField(
    (body as { walletAddress?: unknown }).walletAddress
  );
  const usernameValue = getStringField((body as { username?: unknown }).username);
  const walletAddress = walletValue ? normalizeWalletAddress(walletValue) : "";

  if (!walletAddress) {
    return createValidationError("walletAddress is required.");
  }

  return createValidationSuccess({
    walletAddress,
    username: usernameValue ? normalizeUsername(usernameValue) : null,
  });
}

function parseRequiredQueryParam(
  request: Request,
  key: "username" | "walletAddress"
): ValidationResult<string> {
  const searchParams = new URL(request.url).searchParams;
  const value = searchParams.get(key);
  const normalizedValue =
    key === "walletAddress"
      ? normalizeWalletAddress(value ?? "")
      : normalizeUsername(value ?? "");

  if (!normalizedValue) {
    return createValidationError(`${key} query param is required.`);
  }

  return createValidationSuccess(normalizedValue);
}

export function parseWalletLookupRequest(
  request: Request
): ValidationResult<string> {
  return parseRequiredQueryParam(request, "walletAddress");
}

export function parseUsernameLookupRequest(
  request: Request
): ValidationResult<string> {
  return parseRequiredQueryParam(request, "username");
}
