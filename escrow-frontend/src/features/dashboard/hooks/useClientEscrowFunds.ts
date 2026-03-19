"use client";

import { useEffect, useState } from "react";

import { fetchClientEscrowSummary } from "@/features/escrows/services/escrowApi";

type ClientEscrowFundsState = {
  activeContractsCount: string;
  completedContractsCount: string;
  deadlinesApproachingCount: string;
  error: string | null;
  isLoading: boolean;
  fundsInEscrows: string;
  pendingReviewsCount: string;
};

function formatEscrowFunds(amount: string): string {
  const parsedAmount = Number.parseFloat(amount);

  if (Number.isNaN(parsedAmount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(parsedAmount);
}

export function useClientEscrowFunds(
  clientId: number | undefined
): ClientEscrowFundsState {
  const [activeContractsCount, setActiveContractsCount] = useState("0");
  const [completedContractsCount, setCompletedContractsCount] = useState("0");
  const [deadlinesApproachingCount, setDeadlinesApproachingCount] = useState("0");
  const [fundsInEscrows, setFundsInEscrows] = useState("$0.00");
  const [pendingReviewsCount, setPendingReviewsCount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setActiveContractsCount("0");
      setCompletedContractsCount("0");
      setDeadlinesApproachingCount("0");
      setFundsInEscrows("$0.00");
      setPendingReviewsCount("0");
      setError(null);
      setIsLoading(false);
      return;
    }

    const activeClientId = clientId;
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadFunds(): Promise<void> {
      try {
        const result = await fetchClientEscrowSummary(activeClientId);

        if (!isCancelled) {
          setActiveContractsCount(result.activeContractsCount.toString());
          setCompletedContractsCount(result.completedContractsCount.toString());
          setDeadlinesApproachingCount(
            result.deadlinesApproachingCount.toString()
          );
          setFundsInEscrows(formatEscrowFunds(result.totalAmount));
          setPendingReviewsCount(result.pendingReviewsCount.toString());
        }
      } catch (loadError) {
        if (!isCancelled) {
          setActiveContractsCount("0");
          setCompletedContractsCount("0");
          setDeadlinesApproachingCount("0");
          setFundsInEscrows("$0.00");
          setPendingReviewsCount("0");
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load escrow summary."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFunds();

    return () => {
      isCancelled = true;
    };
  }, [clientId]);

  return {
    activeContractsCount,
    completedContractsCount,
    deadlinesApproachingCount,
    error,
    fundsInEscrows,
    isLoading,
    pendingReviewsCount,
  };
}
