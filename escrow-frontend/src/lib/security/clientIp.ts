const UNKNOWN_CLIENT_IP = "unknown";

function getForwardedClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim() ?? "";
  const clientIp = forwardedFor.split(",")[0]?.trim() ?? "";

  return clientIp || null;
}

function getRealClientIp(request: Request): string | null {
  const clientIp = request.headers.get("x-real-ip")?.trim() ?? "";

  return clientIp || null;
}

export function getClientIp(request: Request): string {
  const clientIp =
    getForwardedClientIp(request) ??
    getRealClientIp(request) ??
    UNKNOWN_CLIENT_IP;

  return clientIp;
}

export function isKnownClientIp(clientIp: string): boolean {
  const isKnown = clientIp !== UNKNOWN_CLIENT_IP;

  return isKnown;
}
