"use client";

import { useEffect, useRef } from "react";

import { getTurnstileSiteKey } from "@/lib/env/public";

type TurnstileWidgetId = number | string;

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

let turnstileScriptPromise: Promise<void> | null = null;

function getTurnstileScriptElement(): HTMLScriptElement | null {
  const script = document.querySelector<HTMLScriptElement>(
    'script[data-turnstile-script="true"]'
  );

  return script;
}

function createTurnstileScript(): HTMLScriptElement {
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.dataset.turnstileScript = "true";
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  return script;
}

function resetTurnstileScriptState(
  script: HTMLScriptElement | null
): void {
  turnstileScriptPromise = null;

  if (script?.parentElement) {
    script.remove();
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = getTurnstileScriptElement() ?? createTurnstileScript();

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        resetTurnstileScriptState(script);
        reject(new Error("Turnstile failed"));
      },
      {
        once: true,
      }
    );

    if (!script.parentElement) {
      document.head.appendChild(script);
    }
  });

  return turnstileScriptPromise;
}

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
  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let isCancelled = false;

    void loadTurnstileScript().then(() => {
      if (
        isCancelled ||
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
    }).catch(() => onTokenChange(null));

    return () => {
      isCancelled = true;
    };
  }, [onTokenChange, siteKey]);

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

  return <div ref={containerRef} className="min-h-[65px]" />;
}
