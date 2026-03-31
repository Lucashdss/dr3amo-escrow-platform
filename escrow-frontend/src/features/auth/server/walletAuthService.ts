import { AppError } from "@/lib/errors";
import { normalizeWalletAddress } from "@/lib/normalizers";
import type {
  AuthSessionResult,
  CreateWalletNonceResult,
  VerifyWalletSignatureRequest,
  VerifyWalletSignatureResult,
} from "@/features/auth/types/auth";
import { findUserByWalletAddress } from "@/features/auth/server/userRepository";
import { type Address, type Hex, verifyMessage } from "viem";

import {
  consumeWalletAuthNonce,
  createWalletAuthNonce,
  createWalletSession,
  findWalletAuthNonceById,
  findWalletSessionByHash,
  revokeWalletSessionByHash,
  touchWalletSessionByHash,
} from "./walletAuthRepository";
import {
  createChallengeNonce,
  createSessionToken,
  hashSessionToken,
  NONCE_TTL_MS,
  SESSION_TTL_MS,
} from "./sessionCookie";

type WalletAuthDependencies = {
  consumeWalletAuthNonce: typeof consumeWalletAuthNonce;
  createWalletAuthNonce: typeof createWalletAuthNonce;
  createWalletSession: typeof createWalletSession;
  findUserByWalletAddress: typeof findUserByWalletAddress;
  findWalletAuthNonceById: typeof findWalletAuthNonceById;
  findWalletSessionByHash: typeof findWalletSessionByHash;
  revokeWalletSessionByHash: typeof revokeWalletSessionByHash;
  touchWalletSessionByHash: typeof touchWalletSessionByHash;
};

const defaultDependencies: WalletAuthDependencies = {
  consumeWalletAuthNonce,
  createWalletAuthNonce,
  createWalletSession,
  findUserByWalletAddress,
  findWalletAuthNonceById,
  findWalletSessionByHash,
  revokeWalletSessionByHash,
  touchWalletSessionByHash,
};

function createSecondPrecisionDate(value: Date): Date {
  return new Date(Math.floor(value.getTime() / 1000) * 1000);
}

function createExpiryDate(ttlMs: number, now: Date): Date {
  return createSecondPrecisionDate(new Date(now.getTime() + ttlMs));
}

function formatIsoDate(value: Date | string): string {
  return new Date(value).toISOString();
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function isExpired(value: Date | string): boolean {
  return new Date(value).getTime() <= Date.now();
}

function isRevoked(value: Date | string | null): boolean {
  return value !== null;
}

function buildChallengeMessage(
  walletAddress: string,
  challengeNonce: string,
  createdAt: Date | string,
  expiresAt: Date | string
): string {
  return [
    "Dr3amo wallet login",
    "",
    `Address: ${walletAddress}`,
    `Nonce: ${challengeNonce}`,
    `URI: ${getAppUrl()}`,
    "Version: 1",
    `Issued At: ${formatIsoDate(createdAt)}`,
    `Expiration Time: ${formatIsoDate(expiresAt)}`,
  ].join("\n");
}

async function findLinkedUser(
  walletAddress: string,
  dependencies: WalletAuthDependencies
) {
  return dependencies.findUserByWalletAddress(walletAddress);
}

export async function createWalletChallenge(
  walletAddress: string,
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<CreateWalletNonceResult> {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const createdAt = createSecondPrecisionDate(new Date());
  const expiresAt = createExpiryDate(NONCE_TTL_MS, createdAt);
  const challengeNonce = createChallengeNonce();
  const challengeId = await dependencies.createWalletAuthNonce({
    challengeNonce,
    createdAt,
    expiresAt,
    walletAddress: normalizedWalletAddress,
  });

  return {
    challengeId,
    expiresAt: expiresAt.toISOString(),
    message: buildChallengeMessage(
      normalizedWalletAddress,
      challengeNonce,
      createdAt,
      expiresAt
    ),
  };
}

export async function verifyWalletChallenge(
  request: VerifyWalletSignatureRequest,
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<{ data: VerifyWalletSignatureResult; sessionToken: string }> {
  const nonceRecord = await dependencies.findWalletAuthNonceById(request.challengeId);
  const walletAddress = normalizeWalletAddress(request.walletAddress);

  if (!nonceRecord) {
    throw new AppError("Challenge not found.", 400);
  }

  if (nonceRecord.wallet_address !== walletAddress) {
    throw new AppError("Wallet address does not match challenge.", 400);
  }

  if (nonceRecord.used_at) {
    throw new AppError("Challenge has already been used.", 400);
  }

  if (isExpired(nonceRecord.expires_at)) {
    throw new AppError("Challenge has expired.", 400);
  }

  const isValid = await verifyMessage({
    address: walletAddress as Address,
    message: buildChallengeMessage(
      walletAddress,
      nonceRecord.challenge_nonce,
      nonceRecord.created_at,
      nonceRecord.expires_at
    ),
    signature: request.signature as Hex,
  });

  if (!isValid) {
    throw new AppError("Signature verification failed.", 400);
  }

  const consumed = await dependencies.consumeWalletAuthNonce(
    nonceRecord.id,
    new Date()
  );

  if (!consumed) {
    throw new AppError("Challenge has already been used.", 400);
  }

  const createdAt = new Date();
  const expiresAt = createExpiryDate(SESSION_TTL_MS, createdAt);
  const sessionToken = createSessionToken();
  await dependencies.createWalletSession({
    createdAt,
    expiresAt,
    lastSeenAt: createdAt,
    sessionTokenHash: hashSessionToken(sessionToken),
    walletAddress,
  });

  return {
    data: {
      user: await findLinkedUser(walletAddress, dependencies),
      walletAddress,
    },
    sessionToken,
  };
}

export async function getAuthSession(
  sessionToken: string,
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<AuthSessionResult | null> {
  const sessionTokenHash = hashSessionToken(sessionToken);
  const session = await dependencies.findWalletSessionByHash(sessionTokenHash);

  if (!session || isRevoked(session.revoked_at) || isExpired(session.expires_at)) {
    return null;
  }

  await dependencies.touchWalletSessionByHash(sessionTokenHash, new Date());

  return {
    user: await findLinkedUser(session.wallet_address, dependencies),
    walletAddress: session.wallet_address,
  };
}

export async function revokeAuthSession(
  sessionToken: string,
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<void> {
  await dependencies.revokeWalletSessionByHash(
    hashSessionToken(sessionToken),
    new Date()
  );
}
