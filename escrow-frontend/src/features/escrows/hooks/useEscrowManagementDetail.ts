"use client";

import { useEffect, useState } from "react";

import { fetchEscrowManagementDetail } from "@/features/escrows/services/escrowApi";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

type EscrowManagementDetailState = {
  error: string | null;
  escrow: EscrowManagementItem | null;
  isLoading: boolean;
};

export function useEscrowManagementDetail(
  escrowId: number | undefined,
  userId: number | undefined
): EscrowManagementDetailState {
  const [escrow, setEscrow] = useState<EscrowManagementItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!escrowId || !userId) {
      setEscrow(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const currentEscrowId = escrowId;
    const currentUserId = userId;
    setIsLoading(true);
    setError(null);

    async function loadEscrow(): Promise<void> {
      try {
        const result = await fetchEscrowManagementDetail(
          currentEscrowId,
          currentUserId
        );

        if (!isCancelled) {
          setEscrow(result.escrow);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setEscrow(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load escrow detail."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEscrow();

    return () => {
      isCancelled = true;
    };
  }, [escrowId, userId]);

  return {
    error,
    escrow,
    isLoading,
  };
}
