import { getAddress, isAddress, type Address } from "viem";

import {
  checkUserByUsername,
  checkUserByWallet,
} from "@/features/auth/services/userApi";
import type { UserRecord } from "@/features/auth/types/user";

export type ResolvedFreelancer = {
  address: Address;
  user: UserRecord;
};

function requireUser(user: UserRecord | null, message: string): UserRecord {
  if (!user) {
    throw new Error(message);
  }

  return user;
}

export async function resolveFreelancer(
  input: string
): Promise<ResolvedFreelancer> {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error("Enter a freelancer username or wallet address.");
  }

  if (isAddress(trimmedInput)) {
    const result = await checkUserByWallet(getAddress(trimmedInput));
    const user = requireUser(
      result.user,
      "Freelancer wallet is not registered in the app."
    );

    return {
      address: getAddress(user.wallet_address),
      user,
    };
  }

  const result = await checkUserByUsername(trimmedInput);
  const user = requireUser(result.user, "Freelancer username was not found.");

  return {
    address: getAddress(user.wallet_address),
    user,
  };
}
