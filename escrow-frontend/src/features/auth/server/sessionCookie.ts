import { createHash, randomBytes } from "crypto";
import type { NextResponse } from "next/server";

export const AUTH_SESSION_COOKIE_NAME = "dr3amo_session";
export const NONCE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function findCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const target = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(target)) ?? null;
  return match ? decodeURIComponent(match.slice(target.length)) : null;
}

export function createChallengeNonce(): string {
  return randomBytes(32).toString("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(sessionToken: string): string {
  return createHash("sha256").update(sessionToken).digest("hex");
}

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return findCookieValue(cookieHeader, AUTH_SESSION_COOKIE_NAME);
}

export function setSessionCookie<T>(
  response: NextResponse<T>,
  sessionToken: string,
  expiresAt: Date
): void {
  response.cookies.set({
    expires: expiresAt,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    name: AUTH_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: isProduction(),
    value: sessionToken,
  });
}

export function clearSessionCookie<T>(response: NextResponse<T>): void {
  response.cookies.set({
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    name: AUTH_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: isProduction(),
    value: "",
  });
}
