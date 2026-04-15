describe("public env helpers", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalGoogleAnalyticsMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalTurnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const originalWalletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  beforeEach(() => {
    jest.resetModules();
    environment.NODE_ENV = "production";
    environment.NEXT_PUBLIC_APP_URL = "https://dr3amo.com";
    delete environment.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    delete environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete environment.NEXT_PUBLIC_WC_PROJECT_ID;
  });

  afterEach(() => {
    environment.NEXT_PUBLIC_GA_MEASUREMENT_ID =
      originalGoogleAnalyticsMeasurementId;
    environment.NODE_ENV = originalNodeEnv;
    environment.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
    environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalTurnstileSiteKey;
    environment.NEXT_PUBLIC_WC_PROJECT_ID = originalWalletConnectProjectId;
  });

  it("lists the approved public env keys", async () => {
    const { PUBLIC_ENV_KEYS } = await import("@/lib/env/public");

    expect(PUBLIC_ENV_KEYS).toEqual([
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_WC_PROJECT_ID",
    ]);
  });

  it("returns the configured production app origin", async () => {
    const { getPublicAppUrl } = await import("@/lib/env/public");

    expect(getPublicAppUrl()).toBe("https://dr3amo.com");
  });

  it("returns the WalletConnect project id when configured", async () => {
    environment.NEXT_PUBLIC_WC_PROJECT_ID = "project-id";
    const { getWalletConnectProjectId } = await import("@/lib/env/public");

    expect(getWalletConnectProjectId()).toBe("project-id");
  });

  it("returns the Google Analytics measurement id when configured", async () => {
    environment.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
    const { getGoogleAnalyticsMeasurementId } = await import("@/lib/env/public");

    expect(getGoogleAnalyticsMeasurementId()).toBe("G-TEST123");
  });

  it("returns the Turnstile site key when configured", async () => {
    environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    const { getTurnstileSiteKey } = await import("@/lib/env/public");

    expect(getTurnstileSiteKey()).toBe("site-key");
  });

  it("returns undefined when the Google Analytics measurement id is missing", async () => {
    const { getGoogleAnalyticsMeasurementId } = await import("@/lib/env/public");

    expect(getGoogleAnalyticsMeasurementId()).toBeUndefined();
  });

  it("allows the localhost fallback outside production", async () => {
    environment.NODE_ENV = "development";
    delete environment.NEXT_PUBLIC_APP_URL;
    const { getPublicAppUrl } = await import("@/lib/env/public");

    expect(getPublicAppUrl()).toBe("http://localhost:3000");
  });
});
