"use client";

import { useEffect, useState } from "react";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";

import { checkUserByWallet, createUser } from "@/features/auth/services/userApi";

function isUserRejected(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 4001
  );
}

function isRequestPending(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === -32002
  );
}

export function useWalletAuth() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [userCheckError, setUserCheckError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const connectors = useConnectors();
  const { mutateAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected, isConnecting: accountIsConnecting } = useAccount();

  const trimmedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "Connect Wallet";
  const headerLabel = isMounted ? trimmedAddress : "Connect Wallet";
  const isConnectModalOpen = isMounted && isLoginModalOpen && !isConnected;
  const isDisconnectOpen = isMounted && isDisconnectModalOpen && isConnected;
  const isConnecting = accountIsConnecting && !connectError;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isConnected || !address) {
      setIsUsernameModalOpen(false);
      setUserCheckError(null);
      setUsernameError(null);
      setUsername("");
      setIsCheckingUser(false);
      return;
    }

    const checkUser = async () => {
      setIsCheckingUser(true);
      setUserCheckError(null);

      try {
        const data = await checkUserByWallet(address);

        if (data.exists && data.user) {
          setIsUsernameModalOpen(false);
          return;
        }

        setIsUsernameModalOpen(true);
      } catch (error) {
        setUserCheckError(
          error instanceof Error ? error.message : "Failed to check user."
        );
      } finally {
        setIsCheckingUser(false);
      }
    };

    void checkUser();
  }, [address, isConnected]);

  useEffect(() => {
    if (!isLoginModalOpen) {
      return;
    }

    setConnectError(null);
  }, [isLoginModalOpen]);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openDisconnectModal = () => {
    setIsDisconnectModalOpen(true);
  };

  const closeDisconnectModal = () => {
    setIsDisconnectModalOpen(false);
  };

  const handleConnect = async (connector: Connector) => {
    setConnectError(null);

    try {
      await mutateAsync({ connector });
      setIsLoginModalOpen(false);
    } catch (error) {
      if (isUserRejected(error)) {
        setConnectError("Connection cancelled.");
      } else if (isRequestPending(error)) {
        setConnectError("A wallet request is already pending. Open your wallet app.");
      } else {
        setConnectError("Failed to connect. Please try again.");
      }
    }
  };

  const handleCreateUser = async () => {
    if (!address) {
      setUsernameError("Wallet is not connected.");
      return;
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setUsernameError("Username is required.");
      return;
    }

    setIsCreatingUser(true);
    setUsernameError(null);

    try {
      await createUser({
        username: trimmedUsername,
        walletAddress: address,
      });

      setIsUsernameModalOpen(false);
      setUsername("");
    } catch (error) {
      setUsernameError(
        error instanceof Error ? error.message : "Failed to create user."
      );
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDisconnectModalOpen(false);
  };

  return {
    address,
    connectError,
    connectors,
    handleConnect,
    handleCreateUser,
    handleDisconnect,
    headerLabel,
    isCheckingUser,
    isConnected,
    isConnectModalOpen,
    isConnecting,
    isCreatingUser,
    isDisconnectOpen,
    isLoginModalOpen,
    isMounted,
    isUsernameModalOpen,
    openDisconnectModal,
    openLoginModal,
    closeDisconnectModal,
    closeLoginModal,
    trimmedAddress,
    userCheckError,
    username,
    setUsername,
    usernameError,
  };
}
