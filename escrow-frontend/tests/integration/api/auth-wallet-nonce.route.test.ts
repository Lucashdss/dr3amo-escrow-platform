const mockCreateWalletAuthNonce = jest.fn();
const mockConsumeRateLimit = jest.fn();

jest.mock("@/lib/security/rateLimit", () => {
  const actual = jest.requireActual("@/lib/security/rateLimit");

  return {
    ...actual,
    consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
  };
});

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  createWalletAuthNonce: (...args: unknown[]) => mockCreateWalletAuthNonce(...args),
  consumeWalletAuthNonce: jest.fn(),
  createWalletSession: jest.fn(),
  findWalletAuthNonceById: jest.fn(),
  findWalletSessionByHash: jest.fn(),
  revokeWalletSessionByHash: jest.fn(),
  touchWalletSessionByHash: jest.fn(),
}));

import { POST } from "@/app/api/auth/wallet/nonce/route";

describe("/api/auth/wallet/nonce route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useRealTimers();
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

  it("returns 400 when walletAddress is missing", async () => {
    const request = new Request("http://localhost/api/auth/wallet/nonce", {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "walletAddress is required." },
    });
  });

  it("returns 400 when walletAddress is invalid", async () => {
    const request = new Request("http://localhost/api/auth/wallet/nonce", {
      body: JSON.stringify({ walletAddress: "invalid" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "walletAddress is invalid." },
    });
  });

  it("creates a challenge and normalizes the wallet address", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-03-30T10:00:00.789Z"));
    mockCreateWalletAuthNonce.mockResolvedValueOnce(17);

    const request = new Request("http://localhost/api/auth/wallet/nonce", {
      body: JSON.stringify({
        walletAddress: "0xAbCDefABcdEFABCdefaBcdeFABCDEFAbCDEfAbCd",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateWalletAuthNonce).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      })
    );
    expect(body.success).toBe(true);
    expect(body.data.challengeId).toBe(17);
    expect(body.data.message).toContain("Dr3amo wallet login");
    expect(body.data.message).toContain(
      "Address: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    );
    expect(body.data.message).toContain("Issued At: 2026-03-30T10:00:00.000Z");
    expect(body.data.expiresAt).toBe("2026-03-30T10:05:00.000Z");
    expect(typeof body.data.expiresAt).toBe("string");
  });

  it("returns 429 when wallet nonce creation is rate limited", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 120,
    });

    const request = new Request("http://localhost/api/auth/wallet/nonce", {
      body: JSON.stringify({
        walletAddress: "0xAbCDefABcdEFABCdefaBcdeFABCDEFAbCDEfAbCd",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(body).toEqual({
      success: false,
      data: null,
      error: {
        message: "Too many wallet challenge requests. Try again later.",
      },
    });
  });
});
