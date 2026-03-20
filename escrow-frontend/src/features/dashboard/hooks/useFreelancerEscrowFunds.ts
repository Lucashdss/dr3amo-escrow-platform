"use client";

import { useEffect, useState } from "react";

import { fetchFreelancerEscrowSummary } from "@/features/escrows/services/escrowApi";

type FreelancerEscrowFundsState = {
  activeContractsCount: string;
  completedContractsCount: string;
  deadlinesApproachingCount: string;
  fundsToReceive: string;
  waitingDeliveriesCount: string;
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

export function useFreelancerEscrowFunds(
  freelancerId: number | undefined
): FreelancerEscrowFundsState {
  const [activeContractsCount, setActiveContractsCount] = useState("0");
  const [completedContractsCount, setCompletedContractsCount] = useState("0");
  const [deadlinesApproachingCount, setDeadlinesApproachingCount] = useState("0");
  const [fundsToReceive, setFundsToReceive] = useState("$0.00");
  const [waitingDeliveriesCount, setWaitingDeliveriesCount] = useState("0");

  useEffect(() => {
    if (!freelancerId) {
      setActiveContractsCount("0");
      setCompletedContractsCount("0");
      setDeadlinesApproachingCount("0");
      setFundsToReceive("$0.00");
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
          setFundsToReceive(formatEscrowFunds(result.totalAmount));
          setWaitingDeliveriesCount(result.waitingDeliveriesCount.toString());
        }
      } catch {
        if (!isCancelled) {
          setActiveContractsCount("0");
          setCompletedContractsCount("0");
          setDeadlinesApproachingCount("0");
          setFundsToReceive("$0.00");
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
    fundsToReceive,
    waitingDeliveriesCount,
  };
}
