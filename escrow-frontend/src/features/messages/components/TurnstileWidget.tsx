"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { getTurnstileSiteKey } from "@/lib/env/public";

type TurnstileWidgetId = number | string;
const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  sitekey: string;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: TurnstileRenderOptions
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  resetKey: number;
};

function resetWidget(widgetId: TurnstileWidgetId | null): void {
  if (widgetId !== null && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

export function TurnstileWidget({
  onTokenChange,
  resetKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    if (typeof window === "undefined" || !window.turnstile) {
      return;
    }

    setIsScriptReady(true);
  }, []);

  useEffect(() => {
    if (
      !siteKey ||
      !isScriptReady ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current !== null
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      callback: (token) => onTokenChange(token),
      "error-callback": () => onTokenChange(null),
      "expired-callback": () => onTokenChange(null),
      sitekey: siteKey,
    });
  }, [isScriptReady, onTokenChange, siteKey]);

  useEffect(() => {
    onTokenChange(null);
    resetWidget(widgetIdRef.current);
  }, [onTokenChange, resetKey]);

  if (!siteKey) {
    return (
      <p className="text-sm text-red-400">
        Bot verification is temporarily unavailable.
      </p>
    );
  }

  return (
    <>
      <Script
        id={TURNSTILE_SCRIPT_ID}
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onError={() => onTokenChange(null)}
        onReady={() => setIsScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
