"use client";

import Link from "next/link";
import { useState } from "react";

import { Hero } from "@/components/landing/Hero";
import { UsernameModal } from "@/components/landing/UsernameModal";
import { WalletModal } from "@/components/landing/WalletModal";
import { useWalletAuth } from "@/features/auth/hooks/useWalletAuth";

export default function Home() {
  const [isFreelancerView, setIsFreelancerView] = useState(false);
  const {
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
  } = useWalletAuth();

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
              href="/client"
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
                openDisconnectModal();
                return;
              }

              openLoginModal();
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

        <Hero isFreelancerView={isFreelancerView} />
      </main>

      <WalletModal
        isConnectModalOpen={isConnectModalOpen}
        isDisconnectOpen={isDisconnectOpen}
        isConnecting={isConnecting}
        connectError={connectError}
        isCheckingUser={isCheckingUser}
        userCheckError={userCheckError}
        isConnected={isConnected}
        address={address}
        trimmedAddress={trimmedAddress}
        connectors={connectors}
        onConnect={handleConnect}
        onCloseConnectModal={closeLoginModal}
        onCloseDisconnectModal={closeDisconnectModal}
        onDisconnect={handleDisconnect}
      />

      <UsernameModal
        isOpen={isMounted && isConnected && isUsernameModalOpen}
        username={username}
        usernameError={usernameError}
        isCreatingUser={isCreatingUser}
        onUsernameChange={setUsername}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
