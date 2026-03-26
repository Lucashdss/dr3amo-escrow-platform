import { normalizeEmailAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  type ValidationResult,
} from "@/lib/validation";
import type { CreateMessageRequest } from "@/features/messages/types/message";

function getStringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getUserId(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number") {
    return -1;
  }

  return Number.isInteger(value) && value > 0 ? value : -1;
}

function isValidEmailAddress(emailAddress: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
}

function validateName(name: string): ValidationResult<string> {
  if (!name) {
    return createValidationError("name is required.");
  }

  if (name.length > 100) {
    return createValidationError("name must be 100 characters or fewer.");
  }

  return createValidationSuccess(name);
}

function validateEmailAddress(emailAddress: string): ValidationResult<string> {
  if (!emailAddress) {
    return createValidationError("emailAddress is required.");
  }

  if (emailAddress.length > 255) {
    return createValidationError("emailAddress must be 255 characters or fewer.");
  }

  if (!isValidEmailAddress(emailAddress)) {
    return createValidationError("emailAddress must be valid.");
  }

  return createValidationSuccess(emailAddress);
}

function validateMessage(message: string): ValidationResult<string> {
  if (!message) {
    return createValidationError("message is required.");
  }

  return createValidationSuccess(message);
}

export function parseCreateMessageRequest(
  body: unknown
): ValidationResult<CreateMessageRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const objectBody = body as Record<string, unknown>;
  const userId = getUserId(objectBody.userId);
  const nameResult = validateName(getStringField(objectBody.name));
  const emailResult = validateEmailAddress(
    normalizeEmailAddress(getStringField(objectBody.emailAddress))
  );
  const messageResult = validateMessage(getStringField(objectBody.message));

  if (userId === -1) {
    return createValidationError("userId must be a positive integer.");
  }

  if (!nameResult.success) {
    return nameResult;
  }

  if (!emailResult.success) {
    return emailResult;
  }

  if (!messageResult.success) {
    return messageResult;
  }

  return createValidationSuccess({
    userId,
    name: nameResult.data,
    emailAddress: emailResult.data,
    message: messageResult.data,
  });
}
