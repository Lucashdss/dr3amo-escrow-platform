import Image from "next/image";
import type { Connector } from "wagmi";

type WalletModalProps = {
  isConnectModalOpen: boolean;
  isDisconnectOpen: boolean;
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
};

const wallets = [
  { name: "MetaMask", icon: "/wallets/metamaskIcon.svg", id: "injected" },
  {
    name: "Coinbase",
    icon: "/wallets/coinbaseIcon.svg",
    id: "coinbaseWalletSDK",
  },
  {
    name: "WalletConnect",
    icon: "/wallets/walletConnectIcon.svg",
    id: "walletConnect",
  },
];

const otherWallets = [{ name: "Phantom", icon: "/wallets/phantomIcon.svg" }];

export function WalletModal({
  isConnectModalOpen,
  isDisconnectOpen,
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {wallets.map(({ name, icon, id }) => {
                const connector = connectors.find((item) => item.id === id);

                if (!connector) {
                  return null;
                }

                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    disabled={isConnecting}
                    onClick={() => onConnect(connector)}
                    className="flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-[#162334] px-3 py-4 text-sm font-semibold text-white/90 transition hover:bg-[#1b2d43] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Image
                      src={icon}
                      alt={name}
                      width={50}
                      height={50}
                      priority
                      loading="eager"
                      unoptimized
                    />
                  </button>
                );
              })}
              {otherWallets.map(({ name, icon }) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  className="flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-[#162334] px-3 py-4 text-sm font-semibold text-white/90 transition hover:bg-[#1b2d43]"
                >
                  <Image
                    src={icon}
                    alt={name}
                    width={50}
                    height={50}
                    priority
                    loading="eager"
                    unoptimized
                  />
                </button>
              ))}
            </div>

            {connectError ? (
              <p className="mt-3 text-sm text-red-400">{connectError}</p>
            ) : null}

            {isCheckingUser ? (
              <p className="mt-3 text-sm text-white/70">Checking account...</p>
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
