"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";
import DecryptedText from "../../components/DecryptedText";

export default function Home() {
  const [isFreelancerView, setIsFreelancerView] = useState(false);
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
  const otherWallets = [
    { name: "Phantom", icon: "/wallets/phantomIcon.svg" },
  ];

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
        const response = await fetch(
          `/api/users/walletaddress?walletAddress=${encodeURIComponent(address)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to check user.");
        }

        if (data?.exists && data?.user) {
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
    if (!isLoginModalOpen) return;
    setConnectError(null);
  }, [isLoginModalOpen]);

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    setConnectError(null);

    try {
      await mutateAsync({ connector });
      setIsLoginModalOpen(false);

    } catch (err: unknown) {
      const isUserRejected = (error: unknown): error is { code: number } =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === 4001;

      const isRequestPending = (error: unknown): error is { code: number } =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === -32002;

      if (isUserRejected(err)) {
        setConnectError("Connection cancelled.");
      } else if (isRequestPending(err)) {
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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create user.");
      }

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

  return (
    <div
      className={`min-h-screen text-white ${isFreelancerView ? "bg-green-700" : "bg-[#2f3136]"
        }`}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <p className="text-xl font-bold tracking-tight">EscrowFreelance</p>
        <div className="flex items-center gap-3">
          {isMounted && isConnected ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-white/70 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#2f3136]"
            >
              Manage Escrows
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!isMounted) return;
              if (isConnected) {
                setIsDisconnectModalOpen(true);
                return;
              }
              setIsLoginModalOpen(true);
            }}
            disabled={!isMounted}
            className="rounded-full border border-white/70 px-6 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#2f3136] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {headerLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-10 text-center md:px-10 md:pt-16">
        {isMounted ? (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setIsFreelancerView(false)}
              className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${isFreelancerView
                ? "text-white/90 hover:bg-white/10"
                : "scale-125 bg-white text-[#2f3136]"
                }`}
            >
              Clients
            </button>
            <button
              type="button"
              onClick={() => setIsFreelancerView(true)}
              className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${isFreelancerView
                ? "scale-125 bg-white text-green-700"
                : "text-white/90 hover:bg-white/10"
                }`}
            >
              Freelancers
            </button>
          </div>
        ) : (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
            <button
              type="button"
              disabled
              className="w-36 rounded-full bg-white px-5 py-2 text-center text-[#2f3136] opacity-90"
            >
              Clients
            </button>
            <button
              type="button"
              disabled
              className="w-36 rounded-full px-5 py-2 text-center text-white/70 opacity-80"
            >
              Freelancers
            </button>
          </div>
        )}

        <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
          <DecryptedText
            key={isFreelancerView ? "freelancer" : "client"}
            text={
              isFreelancerView
                ? "Be sure that your money is waiting for you."
                : "Pay the way your project needs."
            }
            animateOn="view"
          />
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
          Secure escrow payments for freelance work. Fund milestones, approve
          deliveries, and release with confidence.
        </p>

        <section className="mt-14 w-full max-w-3xl rounded-[2rem] bg-white p-4 text-left text-[#2f3136] shadow-2xl md:p-6">
          <div className="mb-4 text-center text-3xl font-black">EscrowFreelance</div>
          <div className="grid gap-4 rounded-3xl bg-[#f3f4f6] p-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-zinc-500">Step 1</p>
              <p className="mt-2 font-semibold">Create a contract</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-zinc-500">Step 2</p>
              <p className="mt-2 font-semibold">Fund your milestone</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-zinc-500">Step 3</p>
              <p className="mt-2 font-semibold">Release when approved</p>
            </div>
          </div>
        </section>
      </main>

      {isConnectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#1f2c3d] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Welcome to EscrowFreelance</h2>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
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
                    onClick={() => handleConnect(connector)}
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
              <p className="mt-3 text-sm text-green-400">
                Connected: {address}
              </p>
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
                onClick={() => setIsDisconnectModalOpen(false)}
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
              onClick={() => {
                disconnect();
                setIsDisconnectModalOpen(false);
              }}
              className="mt-6 w-full rounded-full bg-[#3a3a3a] px-4 py-3 text-base font-semibold text-white/90 transition hover:bg-[#444]"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}

      {isMounted && isConnected && isUsernameModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1f2c3d] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white">Create Username</h2>
            <p className="mt-2 text-sm text-white/70">
              Your wallet is connected, but no user exists yet.
            </p>

            <label htmlFor="username" className="mt-5 block text-sm text-white/80">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              className="mt-2 w-full rounded-xl border border-white/20 bg-[#162334] px-4 py-3 text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
            />

            {usernameError ? (
              <p className="mt-3 text-sm text-red-400">{usernameError}</p>
            ) : null}

            <button
              type="button"
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              className="mt-6 w-full rounded-full bg-white px-4 py-3 text-base font-semibold text-[#1f2c3d] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingUser ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
