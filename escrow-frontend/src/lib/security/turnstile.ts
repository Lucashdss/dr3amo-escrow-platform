import { AppError } from "@/lib/errors";
import { getTurnstileSecretKey } from "@/lib/env/server";
import { isKnownClientIp } from "@/lib/security/clientIp";

export const BOT_VERIFICATION_FAILED_MESSAGE = "Bot verification failed.";

type TurnstileInput = {
  clientIp: string;
  token: string;
};

type TurnstileDependencies = {
  fetch: typeof fetch;
  getTurnstileSecretKey: typeof getTurnstileSecretKey;
};

type TurnstileResponse = {
  success?: boolean;
};

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const defaultDependencies: TurnstileDependencies = {
  fetch,
  getTurnstileSecretKey,
};

function createVerificationBody(input: TurnstileInput, secretKey: string) {
  const body = new URLSearchParams({
    response: input.token,
    secret: secretKey,
  });

  if (isKnownClientIp(input.clientIp)) {
    body.set("remoteip", input.clientIp);
  }

  return body;
}

async function verifyTokenWithTurnstile(
  input: TurnstileInput,
  dependencies: TurnstileDependencies
): Promise<boolean> {
  const response = await dependencies.fetch(TURNSTILE_VERIFY_URL, {
    body: createVerificationBody(input, dependencies.getTurnstileSecretKey()),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    return false;
  }

  const body = (await response.json()) as TurnstileResponse;

  return body.success === true;
}

export async function requireTurnstileVerification(
  input: TurnstileInput,
  dependencies: TurnstileDependencies = defaultDependencies
): Promise<void> {
  try {
    const isVerified = await verifyTokenWithTurnstile(input, dependencies);

    if (!isVerified) {
      throw new Error(BOT_VERIFICATION_FAILED_MESSAGE);
    }
  } catch {
    throw new AppError(BOT_VERIFICATION_FAILED_MESSAGE, 400);
  }
}
