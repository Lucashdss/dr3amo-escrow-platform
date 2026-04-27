"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Menu,
  Wallet,
  X,
} from "lucide-react";
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
  LANDING_NAV_SECTIONS,
  getProtectedLandingRoute,
  type LandingNavItem,
} from "@/components/landing/landingNavigation";
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

type MobileHeaderMenuProps = Readonly<{
  headerLabel: string;
  isConnected: boolean;
  isMounted: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConnectClick: () => void;
  onProtectedNavigation: (route: ProtectedLandingRoute) => void;
}>;

type MobileHeaderNavItemProps = Readonly<{
  item: LandingNavItem;
  onClose: () => void;
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
  "group relative isolate inline-flex min-h-12 min-w-0 items-center justify-center overflow-hidden rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-8 sm:text-base";
const HEADER_CONNECT_CTA_CLASS_NAME =
  "group relative isolate inline-flex min-h-12 min-w-0 items-center justify-center overflow-hidden rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70 sm:px-8 sm:text-base";
const HEADER_WALLET_ADDRESS_CTA_CLASS_NAME =
  "group relative isolate inline-flex min-h-12 max-w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70 sm:max-w-none sm:px-6";

const LandingShellContext = createContext<LandingShellContextValue | null>(null);

function LandingHeader({
  accentTextClassName,
  headerLabel,
  isConnected,
  isMounted,
  onConnectClick,
  onProtectedNavigation,
}: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktopViewport = useDesktopViewport();

  function closeMobileMenu(): void {
    setIsMobileMenuOpen(false);
  }

  function openMobileMenu(): void {
    setIsMobileMenuOpen(true);
  }

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-5 md:px-10">
      <Link href="/" className="shrink-0 text-[2.34375rem] font-bold tracking-tight">
        Dr3amo
      </Link>
      <LandingHeaderNav onProtectedNavigation={onProtectedNavigation} />
      <div className="hidden items-center gap-3 lg:flex">
        {isMounted && isConnected ? (
          <Link
            href="/client"
            className={`${HEADER_CTA_CLASS_NAME} ${accentTextClassName}`}
          >
            <HeaderCtaEffect isVisible={isDesktopViewport && isConnected} />
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
            isVisible={isDesktopViewport && !isConnected}
          />
          <span className="relative z-10 truncate">{headerLabel}</span>
        </button>
      </div>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isMobileMenuOpen}
        onClick={openMobileMenu}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/8 text-white transition active:scale-95 lg:hidden"
      >
        <Menu aria-hidden="true" size={24} strokeWidth={2.4} />
      </button>
      <MobileHeaderMenu
        headerLabel={headerLabel}
        isConnected={isConnected}
        isMounted={isMounted}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onConnectClick={onConnectClick}
        onProtectedNavigation={onProtectedNavigation}
      />
    </header>
  );
}

function useDesktopViewport(): boolean {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1024px)");
    const updateDesktopViewport = (): void => {
      setIsDesktopViewport(desktopMedia.matches);
    };

    updateDesktopViewport();
    desktopMedia.addEventListener("change", updateDesktopViewport);
    return () => {
      desktopMedia.removeEventListener("change", updateDesktopViewport);
    };
  }, []);

  return isDesktopViewport;
}

function MobileHeaderMenu({
  headerLabel,
  isConnected,
  isMounted,
  isOpen,
  onClose,
  onConnectClick,
  onProtectedNavigation,
}: MobileHeaderMenuProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleWalletClick(): void {
    onClose();
    onConnectClick();
  }

  function handleManageClick(): void {
    onClose();
    onProtectedNavigation("/client");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#04052E] px-6 py-6 text-white lg:hidden"
    >
      <div className="mb-14 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="text-4xl font-bold tracking-tight">
          Dr3amo
        </Link>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/8 transition active:scale-95"
        >
          <X aria-hidden="true" size={26} strokeWidth={2.4} />
        </button>
      </div>

      <div className="space-y-9 pb-12">
        <section className="space-y-3">
          <button
            type="button"
            disabled={!isMounted}
            onClick={handleWalletClick}
            className="flex w-full items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/8 p-4 text-left transition active:scale-[0.99] disabled:opacity-60"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#04052E]">
              <Wallet aria-hidden="true" size={25} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold">
                {isConnected ? headerLabel : "Connect Wallet"}
              </span>
              <span className="mt-1 block text-sm text-white/55">
                {isConnected ? "Manage your connection" : "Sign in with your wallet"}
              </span>
            </span>
          </button>

          {isConnected ? (
            <button
              type="button"
              onClick={handleManageClick}
              className="flex w-full items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/8 p-4 text-left transition active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white">
                <BriefcaseBusiness aria-hidden="true" size={25} />
              </span>
              <span>
                <span className="block text-lg font-semibold">Manage Escrows</span>
                <span className="mt-1 block text-sm text-white/55">
                  Open your active contract workspace
                </span>
              </span>
            </button>
          ) : null}
        </section>

        {LANDING_NAV_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <MobileHeaderNavItem
                  key={`${section.title}-${item.label}`}
                  item={item}
                  onClose={onClose}
                  onProtectedNavigation={onProtectedNavigation}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MobileHeaderNavItem({
  item,
  onClose,
  onProtectedNavigation,
}: MobileHeaderNavItemProps) {
  const protectedRoute = getProtectedLandingRoute(item);
  const className =
    "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left text-base font-semibold text-white transition active:scale-[0.99]";

  if (protectedRoute) {
    return (
      <button
        type="button"
        onClick={() => {
          onClose();
          onProtectedNavigation(protectedRoute);
        }}
        className={className}
      >
        <span>{item.label}</span>
        <ArrowUpRight aria-hidden="true" size={18} />
      </button>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} onClick={onClose} className={className}>
        <span>{item.label}</span>
        <ArrowUpRight aria-hidden="true" size={18} />
      </Link>
    );
  }

  return <span className={className}>{item.label}</span>;
}

function HeaderCtaEffect({
  backgroundClassName,
  isVisible,
}: HeaderCtaEffectProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
    >
      {backgroundClassName ? (
        <span
          className={`pointer-events-none absolute inset-0 ${backgroundClassName}`}
        />
      ) : null}
      <LightPillar
        as="span"
        bottomColor="#22007C"
        className="pointer-events-none"
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
        className="pointer-events-none absolute inset-0 bg-black/12 transition-colors duration-200 group-hover:bg-white/10"
      />
    </span>
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
        className={`flex min-h-screen flex-col overflow-x-hidden text-white ${resolvedBackgroundClassName}`}
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
