const mockQuery = jest.fn();
const mockFindUserByWalletAddress = jest.fn();

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

jest.mock("@/lib/users", () => ({
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
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

    mockQuery.mockResolvedValueOnce([users]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ users });
  });

  it("GET returns 500 on query failure", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch users." });
  });

  it("POST returns 400 when walletAddress is missing", async () => {
    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ username: "alice" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "walletAddress is required." });
    expect(mockFindUserByWalletAddress).not.toHaveBeenCalled();
  });

  it("POST returns existing user when wallet already exists", async () => {
    const existingUser = {
      id: 1,
      username: "alice",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
    };
    mockFindUserByWalletAddress.mockResolvedValueOnce(existingUser);

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ username: "alice", walletAddress: "0xAbC" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith("0xabc");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "User already exists.",
      user: existingUser,
    });
  });

  it("POST returns 400 when username is missing for a new wallet", async () => {
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ walletAddress: "0xabc" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "username is required for new users." });
  });

  it("POST creates a user and returns 201", async () => {
    const newUser = {
      id: 7,
      username: "newuser",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
    };

    mockFindUserByWalletAddress.mockResolvedValueOnce(null);
    mockQuery.mockResolvedValueOnce([{ insertId: 7 }]);
    mockQuery.mockResolvedValueOnce([[newUser]]);

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ username: "newuser", walletAddress: "0xAbC" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      message: "User created successfully.",
      user: newUser,
    });
  });

  it("POST returns 500 when an unexpected error occurs", async () => {
    mockFindUserByWalletAddress.mockRejectedValueOnce(new Error("boom"));

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ username: "alice", walletAddress: "0xabc" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to process request." });
  });
});
