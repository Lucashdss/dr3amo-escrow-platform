import type { NextConfig } from "next";
import {
  getPublicAppUrl,
  getTurnstileSiteKey,
  getWalletConnectProjectId,
} from "./src/lib/env/public";

type HeaderDefinition = {
  key: string;
  value: string;
};

const BASE_CONNECT_SOURCES = [
  "'self'",
  "https://mainnet.base.org",
  "https://sepolia.base.org",
];
const WALLET_CONNECT_SOURCES = [
  "https://api.web3modal.org",
  "https://rpc.walletconnect.org",
  "https://*.walletconnect.com",
  "wss://relay.walletconnect.org",
  "wss://*.walletconnect.com",
];
const WALLET_CONNECT_FONT_SOURCES = ["https://fonts.reown.com"];
const WALLET_CONNECT_FRAME_SOURCES = ["https://verify.walletconnect.org"];
const TURNSTILE_CONNECT_SOURCES = ["https://challenges.cloudflare.com"];
const TURNSTILE_FRAME_SOURCES = ["https://challenges.cloudflare.com"];
const TURNSTILE_SCRIPT_SOURCES = ["https://challenges.cloudflare.com"];
const DEVELOPMENT_CONNECT_SOURCES = ["ws:", "http://localhost:*"];

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function validateProductionAppUrl(): void {
  if (isProduction()) {
    getPublicAppUrl();
  }
}

function hasWalletConnectProjectId(): boolean {
  return Boolean(getWalletConnectProjectId());
}

function hasTurnstileSiteKey(): boolean {
  return Boolean(getTurnstileSiteKey());
}

function createScriptSources(): string[] {
  const sources = ["'self'", "'unsafe-inline'"];

  if (hasTurnstileSiteKey()) {
    sources.push(...TURNSTILE_SCRIPT_SOURCES);
  }

  if (!isProduction()) {
    sources.push("'unsafe-eval'");
  }

  return sources;
}

function createConnectSources(): string[] {
  const sources = [...BASE_CONNECT_SOURCES];

  if (hasWalletConnectProjectId()) {
    sources.push(...WALLET_CONNECT_SOURCES);
  }

  if (hasTurnstileSiteKey()) {
    sources.push(...TURNSTILE_CONNECT_SOURCES);
  }

  if (!isProduction()) {
    sources.push(...DEVELOPMENT_CONNECT_SOURCES);
  }

  return sources;
}

function createFrameSources(): string[] {
  const sources = ["'self'"];

  if (hasWalletConnectProjectId()) {
    sources.push(...WALLET_CONNECT_FRAME_SOURCES);
  }

  if (hasTurnstileSiteKey()) {
    sources.push(...TURNSTILE_FRAME_SOURCES);
  }

  return sources;
}

function createFontSources(): string[] {
  const sources = ["'self'", "data:"];

  if (hasWalletConnectProjectId()) {
    sources.push(...WALLET_CONNECT_FONT_SOURCES);
  }

  return sources;
}

function createDirective(name: string, values: string[]): string {
  return `${name} ${values.join(" ")}`;
}

function createContentSecurityPolicy(): string {
  const directives = [
    createDirective("default-src", ["'self'"]),
    createDirective("base-uri", ["'self'"]),
    createDirective("form-action", ["'self'"]),
    createDirective("object-src", ["'none'"]),
    createDirective("frame-ancestors", ["'none'"]),
    createDirective("frame-src", createFrameSources()),
    createDirective("manifest-src", ["'self'"]),
    createDirective("img-src", ["'self'", "data:", "blob:"]),
    createDirective("font-src", createFontSources()),
    createDirective("media-src", ["'self'"]),
    createDirective("worker-src", ["'self'", "blob:"]),
    createDirective("style-src", ["'self'", "'unsafe-inline'"]),
    createDirective("script-src", createScriptSources()),
    createDirective("connect-src", createConnectSources()),
  ];

  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
}

function createPermissionsPolicy(): string {
  return [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "midi=()",
    "fullscreen=(self)",
  ].join(", ");
}

function createSecurityHeaders(): HeaderDefinition[] {
  const headers = [
    {
      key: "Content-Security-Policy",
      value: createContentSecurityPolicy(),
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Permissions-Policy",
      value: createPermissionsPolicy(),
    },
  ];

  if (isProduction()) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  async headers() {
    validateProductionAppUrl();

    return [
      {
        source: "/:path*",
        headers: createSecurityHeaders(),
      },
    ];
  },
  async redirects() {
    validateProductionAppUrl();

    if (!isProduction()) {
      return [];
    }

    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
        ],
        destination: `${getPublicAppUrl()}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
