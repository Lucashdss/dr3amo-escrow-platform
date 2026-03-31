const mockFindUserByWalletAddress = jest.fn();
const mockFindWalletSessionByHash = jest.fn();
const mockTouchWalletSessionByHash = jest.fn();

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  consumeWalletAuthNonce: jest.fn(),
  createWalletAuthNonce: jest.fn(),
  createWalletSession: jest.fn(),
  findWalletAuthNonceById: jest.fn(),
  findWalletSessionByHash: (...args: unknown[]) => mockFindWalletSessionByHash(...args),
  revokeWalletSessionByHash: jest.fn(),
  touchWalletSessionByHash: (...args: unknown[]) => mockTouchWalletSessionByHash(...args),
}));

jest.mock("@/features/auth/server/userRepository", () => ({
  findUserByWalletAddress: (...args: unknown[]) => mockFindUserByWalletAddress(...args),
}));

import { GET } from "@/app/api/auth/session/route";

describe("/api/auth/session route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 without a session cookie", async () => {
    const request = new Request("http://localhost/api/auth/session");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Authentication required." },
    });
  });

  it("returns 401 when the session is not found", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/auth/session", {
      headers: { cookie: "dr3amo_session=token123" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Authentication required." },
    });
  });

  it("returns 401 when the session is revoked", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2099-03-30T10:05:00.000Z",
      id: 3,
      last_seen_at: "2026-03-30T10:00:00.000Z",
      revoked_at: "2026-03-30T10:01:00.000Z",
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });

    const request = new Request("http://localhost/api/auth/session", {
      headers: { cookie: "dr3amo_session=token123" },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 401 when the session is expired", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2026-03-30T10:01:00.000Z",
      id: 3,
      last_seen_at: "2026-03-30T10:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });

    const request = new Request("http://localhost/api/auth/session", {
      headers: { cookie: "dr3amo_session=token123" },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns the linked session user when valid", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2099-03-30T10:05:00.000Z",
      id: 3,
      last_seen_at: "2026-03-30T10:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 2,
      username: "alice",
      wallet_address: "0xabc",
      created_at: "2026-03-30T10:00:00.000Z",
    });

    const request = new Request("http://localhost/api/auth/session", {
      headers: { cookie: "dr3amo_session=token123" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockTouchWalletSessionByHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date)
    );
    expect(body).toEqual({
      success: true,
      data: {
        user: {
          id: 2,
          username: "alice",
          wallet_address: "0xabc",
          created_at: "2026-03-30T10:00:00.000Z",
        },
        walletAddress: "0xabc",
      },
      error: null,
    });
  });
});
