const LOCAL_APP_URL = "http://localhost:3000";

export const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_WC_PROJECT_ID",
] as const;

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

function getRequiredAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const appUrl = isProductionEnvironment()
    ? configuredUrl ?? ""
    : configuredUrl || LOCAL_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production.");
  }

  return appUrl;
}

function parsePublicAppUrl(): URL {
  const appUrl = getRequiredAppUrl();

  try {
    return new URL(appUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
  }
}

export function getPublicAppUrl(): string {
  const publicAppUrl = parsePublicAppUrl();

  if (isProductionEnvironment() && publicAppUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use https in production.");
  }

  return publicAppUrl.origin;
}

export function getWalletConnectProjectId(): string | undefined {
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim();

  return projectId || undefined;
}

export function getTurnstileSiteKey(): string | undefined {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  return siteKey || undefined;
}
