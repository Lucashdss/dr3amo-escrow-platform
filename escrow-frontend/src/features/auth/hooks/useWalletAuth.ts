"use client";

import { useEffect, useState } from "react";
import type { Connector } from "wagmi";
import { useSignMessage } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useModalState } from "@/features/auth/hooks/useModalState";
import { useUsernameRegistration } from "@/features/auth/hooks/useUsernameRegistration";
import { useWalletConnection } from "@/features/auth/hooks/useWalletConnection";
import {
  createWalletNonce,
  logoutWalletSession,
  verifyWalletSignature,
} from "@/features/auth/services/authApi";
import {
  hasSessionForWallet,
  hasSessionMismatch,
} from "@/features/auth/services/walletSession";

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Wallet authentication failed.";
}

export function useWalletAuth() {
  const [isMounted, setIsMounted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const modalState = useModalState();
  const walletConnection = useWalletConnection(isMounted);
  const currentUser = useCurrentUser();
  const usernameRegistration = useUsernameRegistration(currentUser.refresh);
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (walletConnection.isConnected) {
      return;
    }

    usernameRegistration.resetUsername();
  }, [usernameRegistration.resetUsername, walletConnection.isConnected]);

  useEffect(() => {
    if (!hasSessionMismatch(walletConnection.address, currentUser.walletAddress)) {
      return;
    }

    let isCancelled = false;

    async function clearMismatchedSession(): Promise<void> {
      try {
        await logoutWalletSession();
      } catch (error) {
        if (!isCancelled) {
          setAuthError(getAuthErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          currentUser.clear();
          walletConnection.handleDisconnect();
        }
      }
    }

    void clearMismatchedSession();

    return () => {
      isCancelled = true;
    };
  }, [
    currentUser.clear,
    currentUser.walletAddress,
    walletConnection.address,
    walletConnection.handleDisconnect,
  ]);

  async function handleConnect(connector: Connector): Promise<void> {
    const connectedAddress = await walletConnection.handleConnect(connector);

    if (!connectedAddress) {
      return;
    }

    setAuthError(null);

    try {
      if (hasSessionMismatch(connectedAddress, currentUser.walletAddress)) {
        await logoutWalletSession();
        currentUser.clear();
      }

      const challenge = await createWalletNonce({ walletAddress: connectedAddress });
      const signature = await signMessageAsync({ message: challenge.message });
      await verifyWalletSignature({
        challengeId: challenge.challengeId,
        signature,
        walletAddress: connectedAddress,
      });
      currentUser.refresh();
      modalState.closeLoginModal();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      walletConnection.handleDisconnect();
    }
  }

  async function handleDisconnect(): Promise<void> {
    setAuthError(null);

    try {
      await logoutWalletSession();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      currentUser.clear();
      walletConnection.handleDisconnect();
      modalState.closeDisconnectModal();
    }
  }

  const isUsernameModalOpen =
    isMounted &&
    walletConnection.isConnected &&
    !currentUser.isLoading &&
    hasSessionForWallet(walletConnection.address, currentUser.walletAddress) &&
    !currentUser.user &&
    !currentUser.error;

  return {
    address: walletConnection.address,
    authError,
    currentUserId: currentUser.user?.id ?? null,
    hasUser: Boolean(currentUser.user),
    connectError: walletConnection.connectError,
    connectors: walletConnection.connectors,
    handleConnect,
    handleCreateUser: usernameRegistration.handleCreateUser,
    handleDisconnect,
    headerLabel: walletConnection.headerLabel,
    isCheckingUser: currentUser.isLoading,
    isConnected: walletConnection.isConnected,
    isConnectModalOpen:
      isMounted && modalState.isLoginModalOpen && !walletConnection.isConnected,
    isConnecting: walletConnection.isConnecting,
    isCreatingUser: usernameRegistration.isCreatingUser,
    isDisconnectOpen:
      isMounted &&
      modalState.isDisconnectModalOpen &&
      walletConnection.isConnected,
    isLoginModalOpen: modalState.isLoginModalOpen,
    isMounted,
    isUsernameModalOpen,
    openDisconnectModal: modalState.openDisconnectModal,
    openLoginModal: modalState.openLoginModal,
    closeDisconnectModal: modalState.closeDisconnectModal,
    closeLoginModal: modalState.closeLoginModal,
    trimmedAddress: walletConnection.trimmedAddress,
    userCheckError: currentUser.error,
    username: usernameRegistration.username,
    setUsername: usernameRegistration.setUsername,
    usernameError: usernameRegistration.usernameError,
  };
}
