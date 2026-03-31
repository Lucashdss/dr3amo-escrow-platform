const mockCreateUserRecord = jest.fn();
const mockFindUserById = jest.fn();
const mockFindUserByWalletAddress = jest.fn();
const mockFindWalletSessionByHash = jest.fn();
const mockTouchWalletSessionByHash = jest.fn();
const mockConsumeRateLimit = jest.fn();

jest.mock("@/lib/security/rateLimit", () => {
  const actual = jest.requireActual("@/lib/security/rateLimit");

  return {
    ...actual,
    consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
  };
});

jest.mock("@/features/auth/server/userRepository", () => ({
  createUserRecord: (...args: unknown[]) => mockCreateUserRecord(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
  findUserByUsername: jest.fn(),
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
  listUsers: jest.fn(),
}));

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  consumeWalletAuthNonce: jest.fn(),
  createWalletAuthNonce: jest.fn(),
  createWalletSession: jest.fn(),
  findWalletAuthNonceById: jest.fn(),
  findWalletSessionByHash: (...args: unknown[]) =>
    mockFindWalletSessionByHash(...args),
  revokeWalletSessionByHash: jest.fn(),
  touchWalletSessionByHash: (...args: unknown[]) =>
    mockTouchWalletSessionByHash(...args),
}));

import * as routeModule from "@/app/api/users/route";

const { POST } = routeModule;

describe("/api/users route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("does not export a public GET handler", () => {
    expect("GET" in routeModule).toBe(false);
  });

  it("POST returns 401 when the user is not authenticated", async () => {
    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({ username: "alice" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      data: null,
      error: { message: "Authentication required." },
      success: false,
    });
  });

  it("POST returns 429 when user creation is rate limited", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 45,
    });

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({ username: "alice" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(body).toEqual({
      data: null,
      error: { message: "Too many user creation requests. Try again later." },
      success: false,
    });
  });

  it("POST returns existing user when wallet already exists", async () => {
    const existingUser = {
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "alice",
      wallet_address: "0xabc",
    };

    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      expires_at: "2099-02-18T00:00:00.000Z",
      id: 5,
      last_seen_at: "2026-02-18T00:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(existingUser);

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({ username: "alice", walletAddress: "0xdef" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith("0xabc");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        message: "User already exists.",
        user: existingUser,
      },
      error: null,
      success: true,
    });
  });

  it("POST returns 400 when username is missing for a new wallet", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      expires_at: "2099-02-18T00:00:00.000Z",
      id: 5,
      last_seen_at: "2026-02-18T00:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "username is required for new users." },
      success: false,
    });
  });

  it("POST ignores a forged walletAddress in the body and creates the user for the session wallet", async () => {
    const newUser = {
      created_at: "2026-02-18T00:00:00.000Z",
      id: 7,
      username: "newuser",
      wallet_address: "0xabc",
    };

    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      expires_at: "2099-02-18T00:00:00.000Z",
      id: 5,
      last_seen_at: "2026-02-18T00:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);
    mockCreateUserRecord.mockResolvedValueOnce(7);
    mockFindUserById.mockResolvedValueOnce(newUser);

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({
        username: "newuser",
        walletAddress: "0x9999999999999999999999999999999999999999",
      }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith("0xabc");
    expect(mockCreateUserRecord).toHaveBeenCalledWith("newuser", "0xabc");
    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        message: "User created successfully.",
        user: newUser,
      },
      error: null,
      success: true,
    });
  });

  it("POST creates a user and returns 201", async () => {
    const newUser = {
      created_at: "2026-02-18T00:00:00.000Z",
      id: 7,
      username: "newuser",
      wallet_address: "0xabc",
    };

    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      expires_at: "2099-02-18T00:00:00.000Z",
      id: 5,
      last_seen_at: "2026-02-18T00:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);
    mockCreateUserRecord.mockResolvedValueOnce(7);
    mockFindUserById.mockResolvedValueOnce(newUser);

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({ username: "newuser", walletAddress: "0xdef" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        message: "User created successfully.",
        user: newUser,
      },
      error: null,
      success: true,
    });
  });

  it("POST returns 500 when an unexpected error occurs", async () => {
    mockFindWalletSessionByHash.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      expires_at: "2099-02-18T00:00:00.000Z",
      id: 5,
      last_seen_at: "2026-02-18T00:00:00.000Z",
      revoked_at: null,
      session_token_hash: "hash",
      wallet_address: "0xabc",
    });
    mockTouchWalletSessionByHash.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockRejectedValueOnce(new Error("boom"));

    const request = new Request("http://localhost/api/users", {
      body: JSON.stringify({ username: "alice" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { message: "Failed to process request." },
      success: false,
    });
  });
});
