"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeaderNav } from "@/components/landing/LandingHeaderNav";
import {
  type ProtectedLandingRoute,
  shouldRedirectToPendingRoute,
} from "@/components/landing/landingShowcase";
import { LightPillar } from "@/components/LightPillar";
import { UsernameModal } from "@/components/landing/UsernameModal";
import { WalletModal } from "@/components/landing/WalletModal";
import { useWalletAuth } from "@/features/auth/hooks/useWalletAuth";

type LandingShellProps = Readonly<{
  accentTextClassName?: string;
  backgroundClassName?: string;
  children: ReactNode;
}>;

type LandingHeaderProps = Readonly<{
  accentTextClassName: string;
  headerLabel: string;
  isConnected: boolean;
  isMounted: boolean;
  onConnectClick: () => void;
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

type LandingShellContextValue = Readonly<{
  isMounted: boolean;
  navigateToProtectedRoute: (route: ProtectedLandingRoute) => void;
}>;

type HeaderCtaEffectProps = Readonly<{
  backgroundClassName?: string;
  isVisible: boolean;
}>;

const DEFAULT_ACCENT_TEXT_CLASS_NAME = "text-white";
const DEFAULT_BACKGROUND_CLASS_NAME = "bg-[#04052E]";
const HEADER_CTA_CLASS_NAME =
  "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border border-white/70 px-8 py-2.5 text-base font-semibold text-white transition hover:bg-white/10";
const HEADER_CONNECT_CTA_CLASS_NAME =
  "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border border-white/70 px-8 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70";
const HEADER_WALLET_ADDRESS_CTA_CLASS_NAME =
  "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border border-white/70 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70";

const LandingShellContext = createContext<LandingShellContextValue | null>(null);

function LandingHeader({
  accentTextClassName,
  headerLabel,
  isConnected,
  isMounted,
  onConnectClick,
  onProtectedNavigation,
}: LandingHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10">
      <Link href="/" className="shrink-0 text-[2.34375rem] font-bold tracking-tight">
        Dr3amo
      </Link>
      <LandingHeaderNav onProtectedNavigation={onProtectedNavigation} />
      <div className="flex items-center gap-3">
        {isMounted && isConnected ? (
          <Link
            href="/client"
            className={`${HEADER_CTA_CLASS_NAME} ${accentTextClassName}`}
          >
            <HeaderCtaEffect isVisible={isConnected} />
            <span className="relative z-10">Manage Escrows</span>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onConnectClick}
          disabled={!isMounted}
          className={
            isConnected
              ? HEADER_WALLET_ADDRESS_CTA_CLASS_NAME
              : HEADER_CONNECT_CTA_CLASS_NAME
          }
        >
          <HeaderCtaEffect
            backgroundClassName="bg-black"
            isVisible={!isConnected}
          />
          <span className="relative z-10">{headerLabel}</span>
        </button>
      </div>
    </header>
  );
}

function HeaderCtaEffect({
  backgroundClassName,
  isVisible,
}: HeaderCtaEffectProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {backgroundClassName ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-20 ${backgroundClassName}`}
        />
      ) : null}
      <LightPillar
        as="span"
        bottomColor="#22007C"
        className="pointer-events-none -z-10"
        glowAmount={0.01}
        intensity={1.5}
        interactive={false}
        mixBlendMode={backgroundClassName ? "normal" : "screen"}
        noiseIntensity={0.2}
        pillarHeight={0.7}
        pillarRotation={100}
        pillarWidth={10}
        quality="medium"
        rotationSpeed={1}
        topColor="#e4aaff"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-black/12 transition-colors duration-200 group-hover:bg-white/10"
      />
    </>
  );
}

function getAccentTextClassName(accentTextClassName?: string): string {
  return accentTextClassName ?? DEFAULT_ACCENT_TEXT_CLASS_NAME;
}

function getBackgroundClassName(backgroundClassName?: string): string {
  return backgroundClassName ?? DEFAULT_BACKGROUND_CLASS_NAME;
}

export function LandingShell({
  accentTextClassName,
  backgroundClassName,
  children,
}: LandingShellProps) {
  const router = useRouter();
  const [pendingProtectedRoute, setPendingProtectedRoute] =
    useState<ProtectedLandingRoute | null>(null);
  const {
    address,
    authError,
    hasUser,
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
    if (!pendingProtectedRoute) {
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

    router.push(pendingProtectedRoute);
    setPendingProtectedRoute(null);
  }, [hasUser, isCheckingUser, isConnected, pendingProtectedRoute, router]);

  const navigateToProtectedRoute = useCallback(
    (route: ProtectedLandingRoute): void => {
      if (!isMounted) {
        return;
      }

      if (isConnected && hasUser) {
        router.push(route);
        return;
      }

      setPendingProtectedRoute(route);

      if (!isConnected) {
        openLoginModal();
      }
    },
    [hasUser, isConnected, isMounted, openLoginModal, router]
  );

  function handleConnectClick(): void {
    if (!isMounted) {
      return;
    }

    if (isConnected) {
      openDisconnectModal();
      return;
    }

    openLoginModal();
  }

  function handleCloseConnectModal(): void {
    setPendingProtectedRoute(null);
    closeLoginModal();
  }

  const landingShellContextValue = useMemo<LandingShellContextValue>(
    () => ({
      isMounted,
      navigateToProtectedRoute,
    }),
    [isMounted, navigateToProtectedRoute]
  );
  const resolvedAccentTextClassName =
    getAccentTextClassName(accentTextClassName);
  const resolvedBackgroundClassName =
    getBackgroundClassName(backgroundClassName);

  return (
    <LandingShellContext.Provider value={landingShellContextValue}>
      <div
        className={`flex min-h-screen flex-col text-white ${resolvedBackgroundClassName}`}
      >
        <LandingHeader
          accentTextClassName={resolvedAccentTextClassName}
          headerLabel={headerLabel}
          isConnected={isConnected}
          isMounted={isMounted}
          onConnectClick={handleConnectClick}
          onProtectedNavigation={navigateToProtectedRoute}
        />
        {children}
        <LandingFooter onProtectedNavigation={navigateToProtectedRoute} />
        <WalletModal
          isConnectModalOpen={isConnectModalOpen}
          isDisconnectOpen={isDisconnectOpen}
          authError={authError}
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
    </LandingShellContext.Provider>
  );
}

export function useLandingShell(): LandingShellContextValue {
  const context = useContext(LandingShellContext);

  if (!context) {
    throw new Error("useLandingShell must be used within LandingShell.");
  }

  return context;
}
