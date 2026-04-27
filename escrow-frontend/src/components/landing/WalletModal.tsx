import Image from "next/image";
import { useEffect, useState } from "react";
import type { Connector } from "wagmi";

type WalletModalProps = Readonly<{
  isConnectModalOpen: boolean;
  isDisconnectOpen: boolean;
  authError: string | null;
  isConnecting: boolean;
  connectError: string | null;
  isCheckingUser: boolean;
  userCheckError: string | null;
  isConnected: boolean;
  address?: string;
  trimmedAddress: string;
  connectors: readonly Connector[];
  onConnect: (connector: Connector) => void | Promise<void>;
  onCloseConnectModal: () => void;
  onCloseDisconnectModal: () => void;
  onDisconnect: () => void;
}>;

const wallets = [
  {
    name: "MetaMask",
    icon: "/wallets/metamaskIcon.svg",
    connectorIds: ["metaMaskSDK", "metaMask"],
    connectorNames: ["MetaMask"],
    useWalletConnectOnMobile: true,
  },
  {
    name: "WalletConnect",
    icon: "/wallets/walletConnectIcon.svg",
    connectorIds: ["walletConnect"],
    connectorNames: ["WalletConnect"],
    useWalletConnectOnMobile: false,
  },
];

type WalletDefinition = (typeof wallets)[number];

type EthereumProvider = Readonly<{
  isMetaMask?: boolean;
}>;

export function WalletModal({
  isConnectModalOpen,
  isDisconnectOpen,
  authError,
  isConnecting,
  connectError,
  isCheckingUser,
  userCheckError,
  isConnected,
  address,
  trimmedAddress,
  connectors,
  onConnect,
  onCloseConnectModal,
  onCloseDisconnectModal,
  onDisconnect,
}: WalletModalProps) {
  const isMobileBrowser = useIsMobileBrowser();

  return (
    <>
      {isConnectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#1f2c3d] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Welcome to Dr3amo</h2>
              <button
                type="button"
                onClick={onCloseConnectModal}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
              {wallets.map((wallet) => {
                const connector = getWalletConnector(
                  wallet,
                  connectors,
                  isMobileBrowser
                );

                if (!connector) {
                  return null;
                }

                return (
                  <button
                    key={wallet.name}
                    type="button"
                    aria-label={wallet.name}
                    disabled={isConnecting}
                    onClick={() => onConnect(connector)}
                    className="flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-[#162334] px-3 py-4 text-sm font-semibold text-white/90 transition hover:bg-[#1b2d43] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={50}
                      height={50}
                      priority
                      loading="eager"
                      unoptimized
                    />
                  </button>
                );
              })}
            </div>

            {connectError ? (
              <p className="mt-3 text-sm text-red-400">{connectError}</p>
            ) : null}

            {authError ? (
              <p className="mt-3 text-sm text-red-400">{authError}</p>
            ) : null}

            {isCheckingUser ? (
              <p className="mt-3 text-sm text-white/70">Checking session...</p>
            ) : null}

            {userCheckError ? (
              <p className="mt-3 text-sm text-red-400">{userCheckError}</p>
            ) : null}

            {isConnected ? (
              <p className="mt-3 text-sm text-green-400">Connected: {address}</p>
            ) : null}

            <p className="mt-5 text-center text-sm text-white/60">Terms · Privacy</p>
          </div>
        </div>
      ) : null}

      {isDisconnectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2a2a2a] p-6 text-center text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Connected</h2>
              <button
                type="button"
                onClick={onCloseDisconnectModal}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-emerald-300 to-cyan-400 text-2xl font-bold text-black">
              {address ? address.slice(2, 4).toUpperCase() : "W"}
            </div>
            <p className="text-lg font-semibold">{trimmedAddress}</p>
            <p className="mt-2 text-sm text-white/50">0.00 ETH</p>
            <button
              type="button"
              onClick={onDisconnect}
              className="mt-6 w-full rounded-full bg-[#3a3a3a] px-4 py-3 text-base font-semibold text-white/90 transition hover:bg-[#444]"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function useIsMobileBrowser(): boolean {
  const [isMobileBrowser, setIsMobileBrowser] = useState(matchMobileBrowser);

  useEffect(() => {
    setIsMobileBrowser(matchMobileBrowser());
  }, []);

  return isMobileBrowser;
}

function getWalletConnector(
  wallet: WalletDefinition,
  connectors: readonly Connector[],
  isMobileBrowser: boolean
): Connector | undefined {
  const shouldUseWalletConnect =
    wallet.useWalletConnectOnMobile &&
    isMobileBrowser &&
    !isMetaMaskInAppBrowser();
  const connector = shouldUseWalletConnect
    ? findWalletConnectConnector(connectors) ?? findDirectWalletConnector(wallet, connectors)
    : findDirectWalletConnector(wallet, connectors);

  return connector;
}

function findDirectWalletConnector(
  wallet: WalletDefinition,
  connectors: readonly Connector[]
): Connector | undefined {
  return connectors.find(
    (connector) =>
      wallet.connectorIds.includes(connector.id) ||
      wallet.connectorNames.includes(connector.name)
  );
}

function findWalletConnectConnector(
  connectors: readonly Connector[]
): Connector | undefined {
  return connectors.find((connector) => connector.id === "walletConnect");
}

function matchMobileBrowser(): boolean {
  const userAgent = globalThis.navigator?.userAgent ?? "";
  const touchPoints = globalThis.navigator?.maxTouchPoints ?? 0;
  const mobilePattern = /Android|iPhone|iPad|iPod|Mobile/i;
  const isDesktopModeIpad = /Macintosh/i.test(userAgent) && touchPoints > 1;

  return mobilePattern.test(userAgent) || isDesktopModeIpad;
}

function isMetaMaskInAppBrowser(): boolean {
  const ethereum = (globalThis as typeof globalThis & {
    ethereum?: EthereumProvider;
  }).ethereum;

  return Boolean(ethereum?.isMetaMask);
}
