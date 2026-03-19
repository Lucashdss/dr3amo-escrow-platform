"use client";

import { useEffect, useState } from "react";
import type { Connector } from "wagmi";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useModalState } from "@/features/auth/hooks/useModalState";
import { useUsernameRegistration } from "@/features/auth/hooks/useUsernameRegistration";
import { useWalletConnection } from "@/features/auth/hooks/useWalletConnection";

export function useWalletAuth() {
  const [isMounted, setIsMounted] = useState(false);
  const modalState = useModalState();
  const walletConnection = useWalletConnection(isMounted);
  const currentUser = useCurrentUser();
  const usernameRegistration = useUsernameRegistration(
    walletConnection.address,
    currentUser.refresh
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (walletConnection.isConnected) {
      return;
    }

    usernameRegistration.resetUsername();
  }, [usernameRegistration.resetUsername, walletConnection.isConnected]);

  async function handleConnect(connector: Connector): Promise<void> {
    const isConnected = await walletConnection.handleConnect(connector);

    if (isConnected) {
      modalState.closeLoginModal();
    }
  }

  function handleDisconnect(): void {
    walletConnection.handleDisconnect();
    modalState.closeDisconnectModal();
  }

  const isUsernameModalOpen =
    isMounted &&
    walletConnection.isConnected &&
    !currentUser.isLoading &&
    !currentUser.user &&
    !currentUser.error;

  return {
    address: walletConnection.address,
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
