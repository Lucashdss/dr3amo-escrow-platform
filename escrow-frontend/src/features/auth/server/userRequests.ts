import { normalizeUsername, normalizeWalletAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  hasMaxLength,
  type ValidationResult,
} from "@/lib/validation";
import {
  MAX_USERNAME_LENGTH,
  type CreateUserRequest,
} from "@/features/auth/types/user";

function getStringField(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseOptionalUsername(value: unknown): ValidationResult<string | null> {
  const username = normalizeUsername(getStringField(value) ?? "");

  if (!username) {
    return createValidationSuccess(null);
  }

  if (!hasMaxLength(username, MAX_USERNAME_LENGTH)) {
    return createValidationError(
      `username must be ${MAX_USERNAME_LENGTH} characters or fewer.`
    );
  }

  return createValidationSuccess(username);
}

export function parseCreateUserRequest(
  body: unknown
): ValidationResult<CreateUserRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const username = parseOptionalUsername((body as { username?: unknown }).username);

  if (!username.success) {
    return username;
  }

  return createValidationSuccess({
    username: username.data,
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

  if (key === "username" && !hasMaxLength(normalizedValue, MAX_USERNAME_LENGTH)) {
    return createValidationError(
      `username must be ${MAX_USERNAME_LENGTH} characters or fewer.`
    );
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
