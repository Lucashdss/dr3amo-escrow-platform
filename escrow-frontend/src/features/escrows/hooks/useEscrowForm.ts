"use client";

import { useMemo, useState } from "react";

import {
  calculateDeliveryDays,
  parseUpfrontPercentage,
  percentToBps,
} from "@/features/escrows/services/validation";
import type {
  EscrowChainKey,
  TokenSymbol,
} from "@/features/escrows/types/escrow";

type EscrowFormState = {
  createdEscrowAddress: string | null;
  deadline: string;
  deliveryDaysPreview: number | null;
  errorMessage: string | null;
  freelancerInput: string;
  isSubmitting: boolean;
  selectedChain: EscrowChainKey;
  setCreatedEscrowAddress: (value: string | null) => void;
  setDeadline: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  setFreelancerInput: (value: string) => void;
  setIsSubmitting: (value: boolean) => void;
  setSelectedChain: (value: EscrowChainKey) => void;
  setSubmittedHash: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
  setTokenSymbol: (value: TokenSymbol) => void;
  setUpfrontPercentage: (value: string) => void;
  submittedHash: string | null;
  successMessage: string | null;
  tokenSymbol: TokenSymbol;
  upfrontBpsPreview: number | null;
  upfrontPercentage: string;
};

export function useEscrowForm(): EscrowFormState {
  const [selectedChain, setSelectedChain] = useState<EscrowChainKey>("base");
  const [freelancerInput, setFreelancerInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>("USDC");
  const [upfrontPercentage, setUpfrontPercentage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [createdEscrowAddress, setCreatedEscrowAddress] = useState<string | null>(
    null
  );

  const deliveryDaysPreview = useMemo(
    () => calculateDeliveryDays(deadline),
    [deadline]
  );
  const upfrontBpsPreview = useMemo(() => {
    const parsedPercentage = parseUpfrontPercentage(upfrontPercentage);
    return parsedPercentage === null ? null : percentToBps(parsedPercentage);
  }, [upfrontPercentage]);

  return {
    createdEscrowAddress,
    deadline,
    deliveryDaysPreview,
    errorMessage,
    freelancerInput,
    isSubmitting,
    selectedChain,
    setCreatedEscrowAddress,
    setDeadline,
    setErrorMessage,
    setFreelancerInput,
    setIsSubmitting,
    setSelectedChain,
    setSubmittedHash,
    setSuccessMessage,
    setTokenSymbol,
    setUpfrontPercentage,
    submittedHash,
    successMessage,
    tokenSymbol,
    upfrontBpsPreview,
    upfrontPercentage,
  };
}
