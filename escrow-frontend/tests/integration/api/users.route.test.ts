const mockCreateUserRecord = jest.fn();
const mockFindUserById = jest.fn();
const mockFindUserByWalletAddress = jest.fn();
const mockListUsers = jest.fn();
const mockFindWalletSessionByHash = jest.fn();
const mockTouchWalletSessionByHash = jest.fn();

jest.mock("@/features/auth/server/userRepository", () => ({
  createUserRecord: (...args: unknown[]) => mockCreateUserRecord(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
  listUsers: (...args: unknown[]) => mockListUsers(...args),
}));

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  consumeWalletAuthNonce: jest.fn(),
  createWalletAuthNonce: jest.fn(),
  createWalletSession: jest.fn(),
  findWalletAuthNonceById: jest.fn(),
  findWalletSessionByHash: (...args: unknown[]) => mockFindWalletSessionByHash(...args),
  revokeWalletSessionByHash: jest.fn(),
  touchWalletSessionByHash: (...args: unknown[]) => mockTouchWalletSessionByHash(...args),
}));

import { GET, POST } from "@/app/api/users/route";

describe("/api/users route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("GET returns users list", async () => {
    const users = [
      {
        id: 1,
        username: "alice",
        wallet_address: "0xabc",
        created_at: "2026-02-18T00:00:00.000Z",
      },
    ];

    mockListUsers.mockResolvedValueOnce(users);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { users },
      error: null,
    });
  });

  it("GET returns 500 on repository failure", async () => {
    mockListUsers.mockRejectedValueOnce(new Error("db down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to fetch users." },
    });
  });

  it("POST returns 401 when the user is not authenticated", async () => {
    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ username: "alice" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Authentication required." },
    });
  });

  it("POST returns existing user when wallet already exists", async () => {
    const existingUser = {
      id: 1,
      username: "alice",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
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
      method: "POST",
      body: JSON.stringify({ username: "alice", walletAddress: "0xdef" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith("0xabc");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        message: "User already exists.",
        user: existingUser,
      },
      error: null,
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
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "username is required for new users." },
    });
  });

  it("POST creates a user and returns 201", async () => {
    const newUser = {
      id: 7,
      username: "newuser",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
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
      method: "POST",
      body: JSON.stringify({ username: "newuser", walletAddress: "0xdef" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      success: true,
      data: {
        message: "User created successfully.",
        user: newUser,
      },
      error: null,
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
      method: "POST",
      body: JSON.stringify({ username: "alice" }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to process request." },
    });
  });
});
