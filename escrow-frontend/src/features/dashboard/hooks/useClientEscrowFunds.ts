"use client";

import { useEffect, useState } from "react";

import { fetchClientEscrowSummary } from "@/features/escrows/services/escrowApi";

type ClientEscrowFundsState = {
  activeContractsCount: string;
  completedContractsCount: string;
  deadlinesApproachingCount: string;
  error: string | null;
  fundsInEscrowsEth: string;
  fundsInEscrowsUsdc: string;
  isLoading: boolean;
  pendingReviewsCount: string;
};

function formatTokenAmount(amount: string, token: "ETH" | "USDC"): string {
  const parsedAmount = Number.parseFloat(amount);
  const minimumFractionDigits = token === "ETH" ? 4 : 2;

  if (Number.isNaN(parsedAmount)) {
    return token === "ETH" ? "0.0000 ETH" : "0.00 USDC";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: minimumFractionDigits,
    minimumFractionDigits,
  }).format(parsedAmount)
    .concat(` ${token}`);
}

export function useClientEscrowFunds(): ClientEscrowFundsState {
  const [activeContractsCount, setActiveContractsCount] = useState("0");
  const [completedContractsCount, setCompletedContractsCount] = useState("0");
  const [deadlinesApproachingCount, setDeadlinesApproachingCount] = useState("0");
  const [fundsInEscrowsEth, setFundsInEscrowsEth] = useState("0.0000 ETH");
  const [fundsInEscrowsUsdc, setFundsInEscrowsUsdc] = useState("0.00 USDC");
  const [pendingReviewsCount, setPendingReviewsCount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadFunds(): Promise<void> {
      try {
        const result = await fetchClientEscrowSummary();

        if (!isCancelled) {
          setActiveContractsCount(result.activeContractsCount.toString());
          setCompletedContractsCount(result.completedContractsCount.toString());
          setDeadlinesApproachingCount(
            result.deadlinesApproachingCount.toString()
          );
          setFundsInEscrowsEth(formatTokenAmount(result.ethAmount, "ETH"));
          setFundsInEscrowsUsdc(formatTokenAmount(result.usdcAmount, "USDC"));
          setPendingReviewsCount(result.pendingReviewsCount.toString());
        }
      } catch (loadError) {
        if (!isCancelled) {
          setActiveContractsCount("0");
          setCompletedContractsCount("0");
          setDeadlinesApproachingCount("0");
          setFundsInEscrowsEth("0.0000 ETH");
          setFundsInEscrowsUsdc("0.00 USDC");
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
  }, []);

  return {
    activeContractsCount,
    completedContractsCount,
    deadlinesApproachingCount,
    error,
    fundsInEscrowsEth,
    fundsInEscrowsUsdc,
    isLoading,
    pendingReviewsCount,
  };
}
