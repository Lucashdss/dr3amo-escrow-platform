"use client";

import Script from "next/script";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";
import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getGoogleAnalyticsMeasurementId } from "@/lib/env/public";

type AnalyticsConsentState = "accepted" | "rejected" | null;

type AnalyticsContextValue = Readonly<{
  canManageAnalytics: boolean;
  openAnalyticsSettings: () => void;
}>;

type AnalyticsPageView = Readonly<{
  page_location: string;
  page_path: string;
  page_title: string;
}>;

type AnalyticsProviderProps = Readonly<{
  children: ReactNode;
}>;

type AnalyticsConsentBannerProps = Readonly<{
  onAccept: () => void;
  onDecline: () => void;
}>;

type GtagConfigOptions = Readonly<{
  send_page_view: boolean;
}>;

type Gtag = {
  (command: "config", targetId: string, options: GtagConfigOptions): void;
  (command: "event", eventName: "page_view", pageView: AnalyticsPageView): void;
  (command: "js", value: Date): void;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const ANALYTICS_CONTEXT = createContext<AnalyticsContextValue | null>(null);
const ANALYTICS_BOOTSTRAP_SCRIPT_ID = "google-analytics-bootstrap";
const ANALYTICS_SCRIPT_ID = "google-analytics-script";
const ANALYTICS_STORAGE_KEY = "dr3amo-analytics-consent";

function readStoredConsent(): AnalyticsConsentState {
  const storedConsent = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
  const consentState =
    storedConsent === "accepted" || storedConsent === "rejected"
      ? storedConsent
      : null;

  return consentState;
}

function storeConsent(consentState: Exclude<AnalyticsConsentState, null>): void {
  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, consentState);
}

function createPagePath(pathname: string, searchQuery: string): string {
  const pagePath = searchQuery ? `${pathname}?${searchQuery}` : pathname;

  return pagePath;
}

function createPageView(pathname: string, searchQuery: string): AnalyticsPageView {
  const pageView = {
    page_location: window.location.href,
    page_path: createPagePath(pathname, searchQuery),
    page_title: document.title,
  };

  return pageView;
}

function AnalyticsConsentBanner({
  onAccept,
  onDecline,
}: AnalyticsConsentBannerProps) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-4 md:w-full md:max-w-md">
      <div
        role="dialog"
        aria-live="polite"
        aria-modal="false"
        className="rounded-3xl border border-white/10 bg-[#11131d] p-6 text-white shadow-2xl"
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
            Analytics
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            Help us improve Dr3amo
          </h2>
          <p className="text-sm leading-6 text-white/70">
            Allow Google Analytics to measure page visits and usage patterns
            across the website and app. You can change this later from the
            footer on public pages.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#11131d] transition hover:bg-white/85"
          >
            Accept Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsScript({
  measurementId,
  onReady,
}: Readonly<{
  measurementId: string;
  onReady: () => void;
}>) {
  return (
    <>
      <Script id={ANALYTICS_BOOTSTRAP_SCRIPT_ID} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
        `}
      </Script>
      <Script
        id={ANALYTICS_SCRIPT_ID}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onReady={onReady}
      />
    </>
  );
}

function useInitializeConsentState(measurementId: string | undefined) {
  const [consentState, setConsentState] = useState<AnalyticsConsentState>(null);
  const [hasLoadedConsent, setHasLoadedConsent] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    if (!measurementId) {
      setHasLoadedConsent(true);
      return;
    }

    const storedConsent = readStoredConsent();

    setConsentState(storedConsent);
    setIsBannerOpen(storedConsent === null);
    setHasLoadedConsent(true);
  }, [measurementId]);

  function acceptConsent(): void {
    setConsentState("accepted");
    setIsBannerOpen(false);
    storeConsent("accepted");
  }

  function rejectConsent(): void {
    setConsentState("rejected");
    setIsBannerOpen(false);
    storeConsent("rejected");
  }

  function openAnalyticsSettings(): void {
    if (!measurementId) {
      return;
    }

    setIsBannerOpen(true);
  }

  const consentControls = {
    acceptConsent,
    consentState,
    hasLoadedConsent,
    isBannerOpen,
    openAnalyticsSettings,
    rejectConsent,
  };

  return consentControls;
}

function useAnalyticsInitialization(
  isAnalyticsEnabled: boolean,
  isScriptReady: boolean,
  measurementId: string | undefined
) {
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isAnalyticsEnabled) {
      hasInitializedRef.current = false;
      return;
    }

    if (!isScriptReady || !measurementId || !window.gtag || hasInitializedRef.current) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });
    hasInitializedRef.current = true;
  }, [isAnalyticsEnabled, isScriptReady, measurementId]);

  return hasInitializedRef;
}

function AnalyticsPageTracker({
  hasInitializedRef,
  isAnalyticsEnabled,
  isScriptReady,
}: Readonly<{
  hasInitializedRef: { current: boolean };
  isAnalyticsEnabled: boolean;
  isScriptReady: boolean;
}>) {
  useTrackPageViews(hasInitializedRef, isAnalyticsEnabled, isScriptReady);

  return null;
}

function useTrackPageViews(
  hasInitializedRef: { current: boolean },
  isAnalyticsEnabled: boolean,
  isScriptReady: boolean
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string | null>(null);
  const searchQuery = searchParams.toString();

  useEffect(() => {
    if (!isAnalyticsEnabled) {
      lastTrackedPathRef.current = null;
      return;
    }

    if (!isScriptReady || !hasInitializedRef.current || !window.gtag) {
      return;
    }

    const pagePath = createPagePath(pathname, searchQuery);

    if (lastTrackedPathRef.current === pagePath) {
      return;
    }

    lastTrackedPathRef.current = pagePath;
    window.gtag("event", "page_view", createPageView(pathname, searchQuery));
  }, [hasInitializedRef, isAnalyticsEnabled, isScriptReady, pathname, searchQuery]);
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const measurementId = getGoogleAnalyticsMeasurementId();
  const [isScriptReady, setIsScriptReady] = useState(false);
  const {
    acceptConsent,
    consentState,
    hasLoadedConsent,
    isBannerOpen,
    openAnalyticsSettings,
    rejectConsent,
  } = useInitializeConsentState(measurementId);
  const isAnalyticsEnabled =
    Boolean(measurementId) && consentState === "accepted";
  const hasInitializedRef = useAnalyticsInitialization(
    isAnalyticsEnabled,
    isScriptReady,
    measurementId
  );
  const analyticsContextValue = {
    canManageAnalytics: Boolean(measurementId),
    openAnalyticsSettings,
  };

  return (
    <ANALYTICS_CONTEXT.Provider value={analyticsContextValue}>
      {children}
      {isAnalyticsEnabled && measurementId ? (
        <AnalyticsScript
          measurementId={measurementId}
          onReady={() => setIsScriptReady(true)}
        />
      ) : null}
      <Suspense fallback={null}>
        <AnalyticsPageTracker
          hasInitializedRef={hasInitializedRef}
          isAnalyticsEnabled={isAnalyticsEnabled}
          isScriptReady={isScriptReady}
        />
      </Suspense>
      {measurementId && hasLoadedConsent && isBannerOpen ? (
        <AnalyticsConsentBanner
          onAccept={acceptConsent}
          onDecline={rejectConsent}
        />
      ) : null}
    </ANALYTICS_CONTEXT.Provider>
  );
}

export function useAnalyticsSettings(): AnalyticsContextValue {
  const analyticsContextValue = useContext(ANALYTICS_CONTEXT);

  if (!analyticsContextValue) {
    throw new Error(
      "useAnalyticsSettings must be used within AnalyticsProvider."
    );
  }

  return analyticsContextValue;
}
