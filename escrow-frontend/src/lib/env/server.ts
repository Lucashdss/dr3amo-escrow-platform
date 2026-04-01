function getRequiredSecret(key: "TURNSTILE_SECRET_KEY"): string {
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

export function isEscrowAutomationEnabled(): boolean {
  const automationFlag = process.env.ENABLE_ESCROW_AUTOMATION?.trim();

  return automationFlag === "true";
}
