type ServerSecretKey =
  | "CONTACT_MESSAGE_RECIPIENT_EMAIL"
  | "GMAIL_SMTP_APP_PASSWORD"
  | "GMAIL_SMTP_USER"
  | "TURNSTILE_SECRET_KEY";

function getRequiredSecret(key: ServerSecretKey): string {
  const value = process.env[key]?.trim() ?? "";

  if (!value) {
    throw new Error(`${key} must be set.`);
  }

  return value;
}

export function getTurnstileSecretKey(): string {
  const secretKey = getRequiredSecret("TURNSTILE_SECRET_KEY");

  return secretKey;
}

export function getGmailSmtpUser(): string {
  const user = getRequiredSecret("GMAIL_SMTP_USER");

  return user;
}

export function getGmailSmtpAppPassword(): string {
  const password = getRequiredSecret("GMAIL_SMTP_APP_PASSWORD");

  return password;
}

export function getContactMessageRecipientEmail(): string {
  const recipientEmail = getRequiredSecret("CONTACT_MESSAGE_RECIPIENT_EMAIL");

  return recipientEmail;
}

export function isEscrowAutomationEnabled(): boolean {
  const automationFlag = process.env.ENABLE_ESCROW_AUTOMATION?.trim();

  return automationFlag === "true";
}
