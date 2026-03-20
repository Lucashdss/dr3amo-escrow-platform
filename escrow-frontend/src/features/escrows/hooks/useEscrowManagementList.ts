"use client";

import { useEffect, useState } from "react";

import { fetchEscrowManagementList } from "@/features/escrows/services/escrowApi";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

type EscrowManagementListState = {
  error: string | null;
  escrows: EscrowManagementItem[];
  isLoading: boolean;
};

export function useEscrowManagementList(
  userId: number | undefined
): EscrowManagementListState {
  const [escrows, setEscrows] = useState<EscrowManagementItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setEscrows([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const currentUserId = userId;
    setIsLoading(true);
    setError(null);

    async function loadEscrows(): Promise<void> {
      try {
        const result = await fetchEscrowManagementList(currentUserId);

        if (!isCancelled) {
          setEscrows(result.escrows);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setEscrows([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load related escrows."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEscrows();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return {
    error,
    escrows,
    isLoading,
  };
}
