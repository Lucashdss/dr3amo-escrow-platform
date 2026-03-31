const mockFindUserByUsername = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();
const mockConsumeRateLimit = jest.fn();

jest.mock("@/lib/security/rateLimit", () => {
  const actual = jest.requireActual("@/lib/security/rateLimit");

  return {
    ...actual,
    consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
  };
});

jest.mock("@/features/auth/server/userRepository", () => ({
  createUserRecord: jest.fn(),
  findUserById: jest.fn(),
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
  findUserByWalletAddress: jest.fn(),
  listUsers: jest.fn(),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
import { GET } from "@/app/api/users/username/route";

describe("/api/users/username route", () => {
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

  it("returns 401 when the user is not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Authentication required.", 401)
    );

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      data: null,
      error: { message: "Authentication required." },
      success: false,
    });
  });

  it("returns 403 when the session has no linked user", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Registered user required.", 403)
    );

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      data: null,
      error: { message: "Registered user required." },
      success: false,
    });
  });

  it("returns 400 when username query param is missing", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "buyer",
      wallet_address: "0xbuyer",
    });

    const response = await GET(new Request("http://localhost/api/users/username"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "username query param is required." },
      success: false,
    });
  });

  it("returns exists=false when user is not found", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "buyer",
      wallet_address: "0xbuyer",
    });
    mockFindUserByUsername.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(mockFindUserByUsername).toHaveBeenCalledWith("alice");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: { exists: false, user: null },
      error: null,
      success: true,
    });
  });

  it("returns 429 when lookups are rate limited", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "buyer",
      wallet_address: "0xbuyer",
    });
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 12,
    });

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(body).toEqual({
      data: null,
      error: { message: "Too many lookup requests. Try again later." },
      success: false,
    });
  });

  it("returns a minimal user profile when found", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "buyer",
      wallet_address: "0xbuyer",
    });
    mockFindUserByUsername.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 3,
      username: "alice",
      wallet_address: "0xabc",
    });

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        exists: true,
        user: {
          username: "alice",
          wallet_address: "0xabc",
        },
      },
      error: null,
      success: true,
    });
  });

  it("returns 500 when lookup throws", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-02-18T00:00:00.000Z",
      id: 1,
      username: "buyer",
      wallet_address: "0xbuyer",
    });
    mockFindUserByUsername.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(
      new Request("http://localhost/api/users/username?username=alice")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { message: "Failed to check username." },
      success: false,
    });
  });
});
