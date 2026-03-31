"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentSession } from "@/features/auth/services/authApi";
import type { UserRecord } from "@/features/auth/types/user";

type CurrentUserState = {
  clear: () => void;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
  user: UserRecord | null;
  walletAddress: string | null;
};

export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const clear = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setUser(null);
    setWalletAddress(null);
  }, []);

  const refresh = useCallback(() => {
    setReloadKey((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadSession(): Promise<void> {
      try {
        const result = await getCurrentSession();

        if (!isCancelled) {
          setUser(result?.user ?? null);
          setWalletAddress(result?.walletAddress ?? null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          clear();
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load session."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isCancelled = true;
    };
  }, [clear, reloadKey]);

  return {
    clear,
    error,
    isLoading,
    refresh,
    user,
    walletAddress,
  };
}
