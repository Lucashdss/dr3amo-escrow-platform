"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchEscrowManagementDetail } from "@/features/escrows/services/escrowApi";
import {
  readEscrowLiveSnapshot,
  readEscrowLiveState,
} from "@/features/escrows/services/escrowContract";
import type {
  EscrowLiveSnapshot,
  EscrowLiveState,
  EscrowManagementItem,
} from "@/features/escrows/types/escrow";

type EscrowManagementDetailState = {
  error: string | null;
  escrow: EscrowManagementItem | null;
  isLoading: boolean;
  isLoadingLiveEscrowState: boolean;
  isLoadingLiveSnapshot: boolean;
  liveEscrowState: EscrowLiveState | null;
  liveSnapshot: EscrowLiveSnapshot | null;
  refresh: () => Promise<void>;
  refreshLiveEscrowState: () => Promise<void>;
};

type LoadEscrowResult = {
  error: string | null;
  escrow: EscrowManagementItem | null;
};

function getLoadErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load escrow detail.";
}

async function loadEscrowRecord(
  escrowId: number
): Promise<LoadEscrowResult> {
  try {
    const result = await fetchEscrowManagementDetail(escrowId);

    return {
      error: null,
      escrow: result.escrow,
    };
  } catch (error) {
    return {
      error: getLoadErrorMessage(error),
      escrow: null,
    };
  }
}

export function useEscrowManagementDetail(
  escrowId: number | undefined
): EscrowManagementDetailState {
  const [escrow, setEscrow] = useState<EscrowManagementItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLiveSnapshot, setIsLoadingLiveSnapshot] = useState(false);
  const [isLoadingLiveEscrowState, setIsLoadingLiveEscrowState] = useState(false);
  const [liveSnapshot, setLiveSnapshot] = useState<EscrowLiveSnapshot | null>(null);
  const [liveEscrowState, setLiveEscrowState] = useState<EscrowLiveState | null>(
    null
  );

  const refreshLiveSnapshot = useCallback(async (currentEscrow: EscrowManagementItem) => {
    setIsLoadingLiveSnapshot(true);

    try {
      setLiveSnapshot(await readEscrowLiveSnapshot(currentEscrow));
    } catch {
      setLiveSnapshot(null);
    } finally {
      setIsLoadingLiveSnapshot(false);
    }
  }, []);

  const refreshLiveEscrowState = useCallback(async () => {
    if (!escrow) {
      setLiveEscrowState(null);
      return;
    }

    setIsLoadingLiveEscrowState(true);

    try {
      setLiveEscrowState(await readEscrowLiveState(escrow));
    } catch {
      setLiveEscrowState(null);
    } finally {
      setIsLoadingLiveEscrowState(false);
    }
  }, [escrow]);

  const refresh = useCallback(async () => {
    if (!escrowId) {
      setEscrow(null);
      setError(null);
      setLiveSnapshot(null);
      setLiveEscrowState(null);
      return;
    }

    setIsLoading(true);
    const result = await loadEscrowRecord(escrowId);
    setEscrow(result.escrow);
    setError(result.error);

    if (result.escrow) {
      await refreshLiveSnapshot(result.escrow);
    } else {
      setLiveSnapshot(null);
      setLiveEscrowState(null);
    }

    setIsLoading(false);
  }, [escrowId, refreshLiveSnapshot]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    error,
    escrow,
    isLoading,
    isLoadingLiveEscrowState,
    isLoadingLiveSnapshot,
    liveEscrowState,
    liveSnapshot,
    refresh,
    refreshLiveEscrowState,
  };
}
