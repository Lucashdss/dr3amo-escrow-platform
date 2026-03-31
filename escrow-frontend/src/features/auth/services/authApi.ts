import type { ApiResponse } from "@/lib/api/types";
import { fetchApi } from "@/lib/api/fetch";
import type {
  AuthSessionResult,
  CreateWalletNonceRequest,
  CreateWalletNonceResult,
  VerifyWalletSignatureRequest,
  VerifyWalletSignatureResult,
} from "@/features/auth/types/auth";

function getApiError<T>(body: ApiResponse<T>, fallback: string): string {
  return body.success ? fallback : body.error.message;
}

async function parseApiResponse<T>(
  response: Response,
  fallback: string
): Promise<T> {
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(getApiError(body, fallback));
  }

  return body.data;
}

export async function createWalletNonce(
  request: CreateWalletNonceRequest
): Promise<CreateWalletNonceResult> {
  return fetchApi<CreateWalletNonceResult>("/api/auth/wallet/nonce", {
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export async function verifyWalletSignature(
  request: VerifyWalletSignatureRequest
): Promise<VerifyWalletSignatureResult> {
  return fetchApi<VerifyWalletSignatureResult>("/api/auth/wallet/verify", {
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export async function getCurrentSession(): Promise<AuthSessionResult | null> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  return parseApiResponse<AuthSessionResult>(response, "Failed to load session.");
}

export async function logoutWalletSession(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (response.status === 401) {
    return;
  }

  await parseApiResponse(response, "Failed to logout.");
}
