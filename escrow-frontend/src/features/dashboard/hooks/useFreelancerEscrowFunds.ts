"use client";

import { useEffect, useState } from "react";

import { fetchFreelancerEscrowSummary } from "@/features/escrows/services/escrowApi";

type FreelancerEscrowFundsState = {
  activeContractsCount: string;
  completedContractsCount: string;
  deadlinesApproachingCount: string;
  fundsToReceiveEth: string;
  fundsToReceiveUsdc: string;
  waitingDeliveriesCount: string;
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

export function useFreelancerEscrowFunds(
  freelancerId: number | undefined
): FreelancerEscrowFundsState {
  const [activeContractsCount, setActiveContractsCount] = useState("0");
  const [completedContractsCount, setCompletedContractsCount] = useState("0");
  const [deadlinesApproachingCount, setDeadlinesApproachingCount] = useState("0");
  const [fundsToReceiveEth, setFundsToReceiveEth] = useState("0.0000 ETH");
  const [fundsToReceiveUsdc, setFundsToReceiveUsdc] = useState("0.00 USDC");
  const [waitingDeliveriesCount, setWaitingDeliveriesCount] = useState("0");

  useEffect(() => {
    if (!freelancerId) {
      setActiveContractsCount("0");
      setCompletedContractsCount("0");
      setDeadlinesApproachingCount("0");
      setFundsToReceiveEth("0.0000 ETH");
      setFundsToReceiveUsdc("0.00 USDC");
      setWaitingDeliveriesCount("0");
      return;
    }

    const activeFreelancerId = freelancerId;
    let isCancelled = false;

    async function loadFunds(): Promise<void> {
      try {
        const result = await fetchFreelancerEscrowSummary(activeFreelancerId);

        if (!isCancelled) {
          setActiveContractsCount(result.activeContractsCount.toString());
          setCompletedContractsCount(result.completedContractsCount.toString());
          setDeadlinesApproachingCount(
            result.deadlinesApproachingCount.toString()
          );
          setFundsToReceiveEth(formatTokenAmount(result.ethAmount, "ETH"));
          setFundsToReceiveUsdc(formatTokenAmount(result.usdcAmount, "USDC"));
          setWaitingDeliveriesCount(result.waitingDeliveriesCount.toString());
        }
      } catch {
        if (!isCancelled) {
          setActiveContractsCount("0");
          setCompletedContractsCount("0");
          setDeadlinesApproachingCount("0");
          setFundsToReceiveEth("0.0000 ETH");
          setFundsToReceiveUsdc("0.00 USDC");
          setWaitingDeliveriesCount("0");
        }
      }
    }

    void loadFunds();

    return () => {
      isCancelled = true;
    };
  }, [freelancerId]);

  return {
    activeContractsCount,
    completedContractsCount,
    deadlinesApproachingCount,
    fundsToReceiveEth,
    fundsToReceiveUsdc,
    waitingDeliveriesCount,
  };
}
