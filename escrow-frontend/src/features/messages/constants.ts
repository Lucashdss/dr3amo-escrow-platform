export const BOT_VERIFICATION_REQUIRED_MESSAGE = "Complete bot verification.";

export function isBotVerificationRequired(): boolean {
  return process.env.NODE_ENV !== "development";
}
