export type UserRecord = {
  id: number;
  username: string;
  wallet_address: string;
  created_at: string;
};

export type WalletLookupResponse = {
  exists: boolean;
  user: UserRecord | null;
};

export type CreateUserPayload = {
  username: string;
  walletAddress: string;
};

export async function checkUserByWallet(
  walletAddress: string
): Promise<WalletLookupResponse> {
  const response = await fetch(
    `/api/users/walletaddress?walletAddress=${encodeURIComponent(walletAddress)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to check user.");
  }

  return {
    exists: Boolean(data?.exists),
    user: data?.user ?? null,
  };
}

export async function createUser({
  username,
  walletAddress,
}: CreateUserPayload): Promise<{ message?: string; user: UserRecord | null }> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      walletAddress,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to create user.");
  }

  return {
    message: data?.message,
    user: data?.user ?? null,
  };
}
