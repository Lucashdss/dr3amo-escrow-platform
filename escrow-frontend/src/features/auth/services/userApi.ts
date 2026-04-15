import { fetchApi } from "@/lib/api/fetch";
import { normalizeUsername, normalizeWalletAddress } from "@/lib/normalizers";
import type {
  CreateUserRequest,
  CreateUserResult,
  UserLookupResponse,
} from "@/features/auth/types/user";

export async function checkUserByWallet(
  walletAddress: string
) : Promise<UserLookupResponse> {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);

  return fetchApi<UserLookupResponse>(
    `/api/users/walletaddress?walletAddress=${encodeURIComponent(normalizedWalletAddress)}`
  );
}

export async function checkUserByUsername(
  username: string
): Promise<UserLookupResponse> {
  const normalizedUsername = normalizeUsername(username);

  return fetchApi<UserLookupResponse>(
    `/api/users/username?username=${encodeURIComponent(normalizedUsername)}`
  );
}

export async function createUser({
  username,
}: CreateUserRequest): Promise<CreateUserResult> {
  return fetchApi<CreateUserResult>("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
    }),
  });
}

export type {
  CreateUserRequest,
  CreateUserResult,
  UserLookupResponse,
} from "@/features/auth/types/user";
