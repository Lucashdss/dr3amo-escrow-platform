const mockConsumeWalletAuthNonce = jest.fn();
const mockCreateWalletSession = jest.fn();
const mockFindUserByWalletAddress = jest.fn();
const mockFindWalletAuthNonceById = jest.fn();

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  consumeWalletAuthNonce: (...args: unknown[]) => mockConsumeWalletAuthNonce(...args),
  createWalletAuthNonce: jest.fn(),
  createWalletSession: (...args: unknown[]) => mockCreateWalletSession(...args),
  findWalletAuthNonceById: (...args: unknown[]) => mockFindWalletAuthNonceById(...args),
  findWalletSessionByHash: jest.fn(),
  revokeWalletSessionByHash: jest.fn(),
  touchWalletSessionByHash: jest.fn(),
}));

jest.mock("@/features/auth/server/userRepository", () => ({
  findUserByWalletAddress: (...args: unknown[]) => mockFindUserByWalletAddress(...args),
}));

import { privateKeyToAccount } from "viem/accounts";

import { POST } from "@/app/api/auth/wallet/verify/route";

function createChallengeMessage(
  walletAddress: string,
  challengeNonce: string,
  createdAt: string,
  expiresAt: string
): string {
  return [
    "Dr3amo wallet login",
    "",
    `Address: ${walletAddress}`,
    `Nonce: ${challengeNonce}`,
    "URI: http://localhost:3000",
    "Version: 1",
    `Issued At: ${createdAt}`,
    `Expiration Time: ${expiresAt}`,
  ].join("\n");
}

describe("/api/auth/wallet/verify route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when challengeId is missing", async () => {
    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        signature: "0x123",
        walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "challengeId is required." },
    });
  });

  it("returns 400 when challenge is not found", async () => {
    mockFindWalletAuthNonceById.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature: "0x123",
        walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Challenge not found." },
    });
  });

  it("returns 400 when wallet does not match the challenge", async () => {
    mockFindWalletAuthNonceById.mockResolvedValueOnce({
      challenge_nonce: "a".repeat(64),
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2099-03-30T10:05:00.000Z",
      id: 5,
      used_at: null,
      wallet_address: "0x1111111111111111111111111111111111111111",
    });

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature: "0x123",
        walletAddress: "0x2222222222222222222222222222222222222222",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Wallet address does not match challenge." },
    });
  });

  it("returns 400 when challenge has expired", async () => {
    mockFindWalletAuthNonceById.mockResolvedValueOnce({
      challenge_nonce: "a".repeat(64),
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2026-03-30T10:01:00.000Z",
      id: 5,
      used_at: null,
      wallet_address: "0x1111111111111111111111111111111111111111",
    });

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature: "0x123",
        walletAddress: "0x1111111111111111111111111111111111111111",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Challenge has expired." },
    });
  });

  it("returns 400 when challenge was already used", async () => {
    mockFindWalletAuthNonceById.mockResolvedValueOnce({
      challenge_nonce: "a".repeat(64),
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2099-03-30T10:05:00.000Z",
      id: 5,
      used_at: "2026-03-30T10:01:00.000Z",
      wallet_address: "0x1111111111111111111111111111111111111111",
    });

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature: "0x123",
        walletAddress: "0x1111111111111111111111111111111111111111",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Challenge has already been used." },
    });
  });

  it("returns 400 when signature is invalid", async () => {
    const walletAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const signer = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945382dbcb6b0e5d6d3d1f9fbbf2d2c0b9a7a0"
    );
    const signature = await signer.signMessage({
      message: createChallengeMessage(
        walletAddress,
        "b".repeat(64),
        "2026-03-30T10:00:00.000Z",
        "2099-03-30T10:05:00.000Z"
      ),
    });

    mockFindWalletAuthNonceById.mockResolvedValueOnce({
      challenge_nonce: "b".repeat(64),
      created_at: "2026-03-30T10:00:00.000Z",
      expires_at: "2099-03-30T10:05:00.000Z",
      id: 5,
      used_at: null,
      wallet_address: walletAddress,
    });

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature,
        walletAddress,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Signature verification failed." },
    });
  });

  it("sets a session cookie and returns the linked user on success", async () => {
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const walletAddress = account.address.toLowerCase();
    const createdAt = "2026-03-30T10:00:00.000Z";
    const expiresAt = "2099-03-30T10:05:00.000Z";
    const signature = await account.signMessage({
      message: createChallengeMessage(walletAddress, "c".repeat(64), createdAt, expiresAt),
    });

    mockFindWalletAuthNonceById.mockResolvedValueOnce({
      challenge_nonce: "c".repeat(64),
      created_at: createdAt,
      expires_at: expiresAt,
      id: 5,
      used_at: null,
      wallet_address: walletAddress,
    });
    mockConsumeWalletAuthNonce.mockResolvedValueOnce(true);
    mockCreateWalletSession.mockResolvedValueOnce(undefined);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 9,
      username: "alice",
      wallet_address: walletAddress,
      created_at: "2026-03-30T10:00:00.000Z",
    });

    const request = new Request("http://localhost/api/auth/wallet/verify", {
      body: JSON.stringify({
        challengeId: 5,
        signature,
        walletAddress: account.address,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockConsumeWalletAuthNonce).toHaveBeenCalledWith(5, expect.any(Date));
    expect(mockCreateWalletSession).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress,
      })
    );
    expect(response.headers.get("set-cookie")).toContain("dr3amo_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(body).toEqual({
      success: true,
      data: {
        user: {
          id: 9,
          username: "alice",
          wallet_address: walletAddress,
          created_at: "2026-03-30T10:00:00.000Z",
        },
        walletAddress: walletAddress,
      },
      error: null,
    });
  });
});
