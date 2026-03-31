import type { UserRecord } from "@/features/auth/types/user";

export type CreateWalletNonceRequest = {
  walletAddress: string;
};

export type CreateWalletNonceResult = {
  challengeId: number;
  expiresAt: string;
  message: string;
};

export type VerifyWalletSignatureRequest = {
  challengeId: number;
  signature: string;
  walletAddress: string;
};

export type VerifyWalletSignatureResult = {
  user: UserRecord | null;
  walletAddress: string;
};

export type AuthSessionResult = {
  user: UserRecord | null;
  walletAddress: string;
};
