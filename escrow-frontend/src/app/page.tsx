"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Hero } from "@/components/landing/Hero";
import { LandingCodeSection } from "@/components/landing/LandingCodeSection";
import { LandingContactSection } from "@/components/landing/LandingContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingFaqSection } from "@/components/landing/LandingFaqSection";
import { LandingHeaderNav } from "@/components/landing/LandingHeaderNav";
import { LandingShowcaseSection } from "@/components/landing/LandingShowcaseSection";
import {
  CREATE_CONTRACT_ROUTE,
  type DashboardRoute,
  shouldRedirectToPendingRoute,
} from "@/components/landing/landingShowcase";
import { UsernameModal } from "@/components/landing/UsernameModal";
import { WalletModal } from "@/components/landing/WalletModal";
import { useWalletAuth } from "@/features/auth/hooks/useWalletAuth";

function LandingSectionDivider() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
      <div className="border-t border-white/10" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isFreelancerView, setIsFreelancerView] = useState(false);
  const [pendingDashboardRoute, setPendingDashboardRoute] =
    useState<DashboardRoute | null>(null);
  const backgroundClass = isFreelancerView ? "bg-[#22007C]" : "bg-[#04052E]";
  const accentTextClass = isFreelancerView
    ? "text-[#22007C]"
    : "text-[#04052E]";
  const {
    address,
    hasUser,
    currentUserId,
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

  useEffect(() => {
    if (!pendingDashboardRoute) {
      return;
    }

    if (
      !shouldRedirectToPendingRoute({
        hasPendingRoute: true,
        hasUser,
        isCheckingUser,
        isConnected,
      })
    ) {
      return;
    }

    router.push(pendingDashboardRoute);
    setPendingDashboardRoute(null);
  }, [hasUser, isCheckingUser, isConnected, pendingDashboardRoute, router]);

  function handleCreateContractClick(): void {
    if (!isMounted) {
      return;
    }

    if (isConnected && hasUser) {
      router.push(CREATE_CONTRACT_ROUTE);
      return;
    }

    setPendingDashboardRoute(CREATE_CONTRACT_ROUTE);

    if (!isConnected) {
      openLoginModal();
    }
  }

  function handleCloseConnectModal(): void {
    setPendingDashboardRoute(null);
    closeLoginModal();
  }

  return (
    <div className={`flex min-h-screen flex-col text-white ${backgroundClass}`}>
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10">
        <p className="shrink-0 text-3xl font-bold tracking-tight">Dr3amo</p>
        <LandingHeaderNav />
        <div className="flex items-center gap-3">
          {isMounted && isConnected ? (
            <Link
              href="/client"
              className={`rounded-full border border-white/70 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 ${accentTextClass}`}
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
            className="rounded-full border border-white/70 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {headerLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-20 pt-10 text-center md:px-10 md:pt-16">
        {isMounted ? (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setIsFreelancerView(false)}
              className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${isFreelancerView
                ? "text-white/90 hover:bg-white/10"
                : "scale-125 bg-white text-[#04052E]"
                }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setIsFreelancerView(true)}
              className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${isFreelancerView
                ? "scale-125 bg-white text-[#22007C]"
                : "text-white/90 hover:bg-white/10"
                }`}
            >
              Seller
            </button>
          </div>
        ) : (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
            <button
              type="button"
              disabled
              className="w-36 rounded-full bg-white px-5 py-2 text-center text-[#04052E] opacity-90"
            >
              Buyer
            </button>
            <button
              type="button"
              disabled
              className="w-36 rounded-full px-5 py-2 text-center text-white/70 opacity-80"
            >
              Seller
            </button>
          </div>
        )}

        <Hero isFreelancerView={isFreelancerView} />
      </main>

      <LandingSectionDivider />
      <LandingShowcaseSection onCreateContract={handleCreateContractClick} />
      <LandingSectionDivider />
      <LandingCodeSection />
      <LandingSectionDivider />
      <LandingFaqSection />
      <LandingSectionDivider />
      <LandingContactSection userId={currentUserId} />
      <LandingSectionDivider />

      <LandingFooter />

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
        onCloseConnectModal={handleCloseConnectModal}
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
