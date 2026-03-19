"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { checkUserByWallet } from "@/features/auth/services/userApi";
import type { UserRecord } from "@/features/auth/types/user";

type CurrentUserState = {
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
  user: UserRecord | null;
};

export function useCurrentUser(): CurrentUserState {
  const { address } = useAccount();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => {
    setReloadKey((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    if (!address) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const walletAddress = address;
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadUser(): Promise<void> {
      try {
        const result = await checkUserByWallet(walletAddress);

        if (!isCancelled) {
          setUser(result.user);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setUser(null);
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load user."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isCancelled = true;
    };
  }, [address, reloadKey]);

  return {
    error,
    isLoading,
    refresh,
    user,
  };
}
