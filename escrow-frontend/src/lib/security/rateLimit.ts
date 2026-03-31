import type { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/api/responses";
import { incrementRateLimitCounter } from "@/lib/security/rateLimitRepository";

export type RateLimitScope =
  | "message_submit"
  | "user_create"
  | "user_lookup"
  | "wallet_nonce";

type RateLimitPolicy = {
  limit: number;
  message: string;
  windowMs: number;
};

type RateLimitInput = {
  identifier: string;
  scope: RateLimitScope;
};

type RateLimitDependencies = {
  incrementRateLimitCounter: typeof incrementRateLimitCounter;
  now: () => Date;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const RATE_LIMIT_POLICIES: Record<RateLimitScope, RateLimitPolicy> = {
  message_submit: {
    limit: 5,
    message: "Too many message requests. Try again later.",
    windowMs: 10 * 60 * 1000,
  },
  user_create: {
    limit: 5,
    message: "Too many user creation requests. Try again later.",
    windowMs: 60 * 60 * 1000,
  },
  user_lookup: {
    limit: 60,
    message: "Too many lookup requests. Try again later.",
    windowMs: 60 * 1000,
  },
  wallet_nonce: {
    limit: 5,
    message: "Too many wallet challenge requests. Try again later.",
    windowMs: 10 * 60 * 1000,
  },
};

const defaultDependencies: RateLimitDependencies = {
  incrementRateLimitCounter,
  now: () => new Date(),
};

function getRateLimitPolicy(scope: RateLimitScope): RateLimitPolicy {
  const policy = RATE_LIMIT_POLICIES[scope];

  return policy;
}

function createWindowStart(now: Date, windowMs: number): Date {
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  return windowStart;
}

function createRetryAfterSeconds(
  now: Date,
  windowStart: Date,
  windowMs: number
): number {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)
  );

  return retryAfterSeconds;
}

export function createRateLimitIdentifier(parts: string[]): string {
  const identifier = parts.join(":");

  return identifier;
}

export async function consumeRateLimit(
  input: RateLimitInput,
  dependencies: RateLimitDependencies = defaultDependencies
): Promise<RateLimitResult> {
  const policy = getRateLimitPolicy(input.scope);
  const now = dependencies.now();
  const windowStart = createWindowStart(now, policy.windowMs);
  const count = await dependencies.incrementRateLimitCounter({
    identifier: input.identifier,
    now,
    scope: input.scope,
    windowStart,
  });

  return {
    allowed: count <= policy.limit,
    retryAfterSeconds: createRetryAfterSeconds(now, windowStart, policy.windowMs),
  };
}

export function createRateLimitResponse(
  scope: RateLimitScope,
  retryAfterSeconds: number
): NextResponse {
  const response = createErrorResponse(getRateLimitPolicy(scope).message, 429);
  response.headers.set("Retry-After", String(retryAfterSeconds));

  return response;
}
