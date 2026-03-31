"use client";

import { useState } from "react";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";

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

function getConnectErrorMessage(error: unknown): string {
  if (isUserRejected(error)) {
    return "Connection cancelled.";
  }

  if (isRequestPending(error)) {
    return "A wallet request is already pending. Open your wallet app.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to connect. Please try again.";
}

function getTrimmedAddress(address?: string): string {
  return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect Wallet";
}

type WalletConnectionState = {
  address?: string;
  connectError: string | null;
  connectors: readonly Connector[];
  handleConnect: (connector: Connector) => Promise<string | null>;
  handleDisconnect: () => void;
  headerLabel: string;
  isConnected: boolean;
  isConnecting: boolean;
  trimmedAddress: string;
};

export function useWalletConnection(isMounted: boolean): WalletConnectionState {
  const [connectError, setConnectError] = useState<string | null>(null);
  const connectors = useConnectors();
  const { mutateAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected, isConnecting: accountIsConnecting } = useAccount();
  const trimmedAddress = getTrimmedAddress(address);

  function handleDisconnect(): void {
    setConnectError(null);
    disconnect();
  }

  async function handleConnect(connector: Connector): Promise<string | null> {
    setConnectError(null);

    try {
      const result = await mutateAsync({ connector });
      return result.accounts[0] ?? null;
    } catch (error) {
      setConnectError(getConnectErrorMessage(error));
      return null;
    }
  }

  return {
    address,
    connectError,
    connectors,
    handleConnect,
    handleDisconnect,
    headerLabel: isMounted ? trimmedAddress : "Connect Wallet",
    isConnected,
    isConnecting: accountIsConnecting && !connectError,
    trimmedAddress,
  };
}
