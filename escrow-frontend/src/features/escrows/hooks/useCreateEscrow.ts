"use client";

import type { FormEvent } from "react";

import { useAccount, useSwitchChain } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ESCROW_DEPLOYMENT_CONFIGS } from "@/features/escrows/config/deployment";
import { useEscrowForm } from "@/features/escrows/hooks/useEscrowForm";
import { persistEscrow } from "@/features/escrows/services/escrowApi";
import { deployEscrow } from "@/features/escrows/services/escrowDeployment";
import { resolveFreelancer } from "@/features/escrows/services/freelancerLookup";
import {
  getEscrowErrorMessage,
  validateEscrowSubmission,
} from "@/features/escrows/services/validation";

function getDisplayValues(address: string | undefined, username: string | undefined) {
  const trimmedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Wallet not connected";

  return {
    displayName: username ?? trimmedAddress,
    profileInitial: (username?.[0] ?? address?.[2] ?? "C").toUpperCase(),
    trimmedAddress,
  };
}

export function useCreateEscrow() {
  const account = useAccount();
  const switchChain = useSwitchChain();
  const { isLoading: isLoadingClientUser, user: clientUser } = useCurrentUser();
  const form = useEscrowForm();
  const selectedChainConfig = ESCROW_DEPLOYMENT_CONFIGS[form.selectedChain];
  const isWrongNetwork =
    account.isConnected && account.chainId !== selectedChainConfig.chainId;
  const displayValues = getDisplayValues(account.address, clientUser?.username);

  async function handleSwitchChain(): Promise<void> {
    try {
      form.setErrorMessage(null);
      await switchChain.switchChainAsync({
        chainId: selectedChainConfig.chainId,
      });
    } catch (error) {
      form.setErrorMessage(
        getEscrowErrorMessage(
          error,
          `Unable to switch to ${selectedChainConfig.displayName}.`
        )
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validation = validateEscrowSubmission({
      clientUser,
      deadline: form.deadline,
      isConnected: account.isConnected,
      isWrongNetwork,
      selectedChain: form.selectedChain,
      upfrontPercentage: form.upfrontPercentage,
      walletAddress: account.address,
    });

    if (!validation.success) {
      form.setErrorMessage(validation.error);
      return;
    }

    form.setIsSubmitting(true);
    form.setErrorMessage(null);
    form.setSuccessMessage(null);
    form.setSubmittedHash(null);
    form.setCreatedEscrowAddress(null);

    try {
      const freelancer = await resolveFreelancer(form.freelancerInput);
      const deployment = await deployEscrow({
        chainKey: form.selectedChain,
        deliveryDays: validation.data.deliveryDays,
        freelancerAddress: freelancer.address,
        tokenSymbol: form.tokenSymbol,
        upfrontPercentage: validation.data.upfrontPercentage,
      });
      const persistedEscrow = await persistEscrow({
        amount: "0",
        chainKey: form.selectedChain,
        clientWalletAddress: account.address ?? "",
        contractAddress: deployment.escrowAddress,
        deadline: form.deadline,
        freelancerWalletAddress: freelancer.user.wallet_address,
        state: "created",
        tokenSymbol: form.tokenSymbol,
        txHash: deployment.txHash,
      });

      form.setCreatedEscrowAddress(deployment.escrowAddress);
      form.setSubmittedHash(deployment.txHash);
      form.setSuccessMessage(persistedEscrow.message);
    } catch (error) {
      form.setErrorMessage(
        getEscrowErrorMessage(error, "Failed to create the escrow contract.")
      );
    } finally {
      form.setIsSubmitting(false);
    }
  }

  return {
    clientUser,
    displayValues,
    form,
    handleSubmit,
    handleSwitchChain,
    isLoadingClientUser,
    isSwitchingChain: switchChain.isPending,
    isWrongNetwork,
    selectedChainConfig,
  };
}
