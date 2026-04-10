import { normalizeEmailAddress } from "@/lib/normalizers";
import {
  createValidationError,
  createValidationSuccess,
  hasMaxLength,
  type ValidationResult,
} from "@/lib/validation";
import { isBotVerificationRequired } from "@/features/messages/constants";
import type { CreateMessageRequest } from "@/features/messages/types/message";

const MAX_CONTACT_NAME_LENGTH = 100;
const MAX_CONTACT_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_ADDRESS_LENGTH = 255;

function getStringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasWhitespaceCharacter(value: string): boolean {
  let hasWhitespace = false;

  for (const character of value) {
    if (character.trim() === "") {
      hasWhitespace = true;
    }
  }

  return hasWhitespace;
}

function isValidEmailAddress(emailAddress: string): boolean {
  const atIndex = emailAddress.indexOf("@");
  const lastAtIndex = emailAddress.lastIndexOf("@");
  const dotIndex = emailAddress.lastIndexOf(".");
  let isValid = !hasWhitespaceCharacter(emailAddress);

  if (atIndex <= 0 || atIndex !== lastAtIndex) {
    isValid = false;
  }

  if (dotIndex <= atIndex + 1 || dotIndex === emailAddress.length - 1) {
    isValid = false;
  }

  return isValid;
}

function validateName(name: string): ValidationResult<string> {
  if (!name) {
    return createValidationError("name is required.");
  }

  if (!hasMaxLength(name, MAX_CONTACT_NAME_LENGTH)) {
    return createValidationError(
      `name must be ${MAX_CONTACT_NAME_LENGTH} characters or fewer.`
    );
  }

  return createValidationSuccess(name);
}

function validateEmailAddress(emailAddress: string): ValidationResult<string> {
  if (!emailAddress) {
    return createValidationError("emailAddress is required.");
  }

  if (!hasMaxLength(emailAddress, MAX_EMAIL_ADDRESS_LENGTH)) {
    return createValidationError(
      `emailAddress must be ${MAX_EMAIL_ADDRESS_LENGTH} characters or fewer.`
    );
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

  if (!hasMaxLength(message, MAX_CONTACT_MESSAGE_LENGTH)) {
    return createValidationError(
      `message must be ${MAX_CONTACT_MESSAGE_LENGTH} characters or fewer.`
    );
  }

  return createValidationSuccess(message);
}

function validateTurnstileToken(token: string): ValidationResult<string> {
  if (!isBotVerificationRequired()) {
    return createValidationSuccess(token);
  }

  if (!token) {
    return createValidationError("turnstileToken is required.");
  }

  return createValidationSuccess(token);
}

export function parseCreateMessageRequest(
  body: unknown
): ValidationResult<CreateMessageRequest> {
  if (!body || typeof body !== "object") {
    return createValidationError("Request body must be an object.");
  }

  const objectBody = body as Record<string, unknown>;
  const nameResult = validateName(getStringField(objectBody.name));
  const emailResult = validateEmailAddress(
    normalizeEmailAddress(getStringField(objectBody.emailAddress))
  );
  const messageResult = validateMessage(getStringField(objectBody.message));
  const turnstileResult = validateTurnstileToken(
    getStringField(objectBody.turnstileToken)
  );

  if ("userId" in objectBody) {
    return createValidationError("userId must not be provided.");
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

  if (!turnstileResult.success) {
    return turnstileResult;
  }

  return createValidationSuccess({
    name: nameResult.data,
    emailAddress: emailResult.data,
    message: messageResult.data,
    turnstileToken: turnstileResult.data,
  });
}
