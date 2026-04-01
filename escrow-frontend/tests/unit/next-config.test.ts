type HeaderDefinition = {
  key: string;
  value: string;
};

function getHeaderValue(headers: HeaderDefinition[], key: string): string {
  const header = headers.find((item) => item.key === key);

  if (!header) {
    throw new Error(`Missing header: ${key}`);
  }

  return header.value;
}

async function loadHeaders() {
  jest.resetModules();
  const configModule = await import("../../next.config");
  const config = configModule.default;

  if (!config.headers) {
    throw new Error("next.config.ts does not export headers()");
  }

  return config.headers();
}

async function loadRedirects() {
  jest.resetModules();
  const configModule = await import("../../next.config");
  const config = configModule.default;

  if (!config.redirects) {
    throw new Error("next.config.ts does not export redirects()");
  }

  return config.redirects();
}

describe("next.config security headers", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalTurnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const originalWalletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  beforeEach(() => {
    environment.NODE_ENV = "production";
    environment.NEXT_PUBLIC_APP_URL = "https://www.dr3amo.com";
    delete environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete environment.NEXT_PUBLIC_WC_PROJECT_ID;
  });

  afterEach(() => {
    environment.NODE_ENV = originalNodeEnv;
    environment.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
    environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalTurnstileSiteKey;
    environment.NEXT_PUBLIC_WC_PROJECT_ID = originalWalletConnectProjectId;
  });

  it("applies the baseline security headers to all routes", async () => {
    const rules = await loadHeaders();
    const rule = rules[0];

    expect(rule.source).toBe("/:path*");
    expect(rule.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Content-Security-Policy" }),
        expect.objectContaining({
          key: "X-Content-Type-Options",
          value: "nosniff",
        }),
        expect.objectContaining({
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        }),
        expect.objectContaining({
          key: "X-Frame-Options",
          value: "DENY",
        }),
        expect.objectContaining({ key: "Permissions-Policy" }),
        expect.objectContaining({
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        }),
      ])
    );

    const contentSecurityPolicy = getHeaderValue(
      rule.headers,
      "Content-Security-Policy"
    );

    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("https://mainnet.base.org");
    expect(contentSecurityPolicy).toContain("https://sepolia.base.org");
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy).not.toContain("https://rpc.walletconnect.org");
    expect(contentSecurityPolicy).not.toContain("https://challenges.cloudflare.com");
  });

  it("redirects production http requests to the configured https origin", async () => {
    const redirects = await loadRedirects();

    expect(redirects).toEqual([
      {
        destination: "https://www.dr3amo.com/:path*",
        has: [
          {
            key: "x-forwarded-proto",
            type: "header",
            value: "http",
          },
        ],
        permanent: true,
        source: "/:path*",
      },
    ]);
  });

  it("includes WalletConnect origins only when configured", async () => {
    environment.NEXT_PUBLIC_WC_PROJECT_ID = "project-id";

    const rules = await loadHeaders();
    const contentSecurityPolicy = getHeaderValue(
      rules[0].headers,
      "Content-Security-Policy"
    );

    expect(contentSecurityPolicy).toContain("https://api.web3modal.org");
    expect(contentSecurityPolicy).toContain("https://rpc.walletconnect.org");
    expect(contentSecurityPolicy).toContain("https://*.walletconnect.com");
    expect(contentSecurityPolicy).toContain("wss://relay.walletconnect.org");
    expect(contentSecurityPolicy).toContain("wss://*.walletconnect.com");
    expect(contentSecurityPolicy).toContain("frame-src 'self' https://verify.walletconnect.org");
    expect(contentSecurityPolicy).toContain("font-src 'self' data: https://fonts.reown.com");
  });

  it("includes Turnstile origins only when configured", async () => {
    environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";

    const rules = await loadHeaders();
    const contentSecurityPolicy = getHeaderValue(
      rules[0].headers,
      "Content-Security-Policy"
    );

    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com");
    expect(contentSecurityPolicy).toContain("frame-src 'self' https://challenges.cloudflare.com");
    expect(contentSecurityPolicy).toContain("connect-src 'self'");
    expect(contentSecurityPolicy).toContain("https://challenges.cloudflare.com");
  });

  it("adds development-only script and connect relaxations outside production", async () => {
    environment.NODE_ENV = "development";
    delete environment.NEXT_PUBLIC_APP_URL;

    const rules = await loadHeaders();
    const contentSecurityPolicy = getHeaderValue(
      rules[0].headers,
      "Content-Security-Policy"
    );

    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(contentSecurityPolicy).toContain("connect-src 'self'");
    expect(contentSecurityPolicy).toContain("ws:");
    expect(contentSecurityPolicy).toContain("http://localhost:*");
    expect(rules[0].headers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Strict-Transport-Security" }),
      ])
    );
  });

  it("rejects a non-https public app url in production", async () => {
    environment.NEXT_PUBLIC_APP_URL = "http://www.dr3amo.com";

    await expect(loadHeaders()).rejects.toThrow(
      "NEXT_PUBLIC_APP_URL must use https in production."
    );
  });
});
