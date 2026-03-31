const mockRevokeWalletSessionByHash = jest.fn();

jest.mock("@/features/auth/server/walletAuthRepository", () => ({
  consumeWalletAuthNonce: jest.fn(),
  createWalletAuthNonce: jest.fn(),
  createWalletSession: jest.fn(),
  findWalletAuthNonceById: jest.fn(),
  findWalletSessionByHash: jest.fn(),
  revokeWalletSessionByHash: (...args: unknown[]) => mockRevokeWalletSessionByHash(...args),
  touchWalletSessionByHash: jest.fn(),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("/api/auth/logout route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("clears the session cookie when logging out", async () => {
    mockRevokeWalletSessionByHash.mockResolvedValueOnce(undefined);

    const request = new Request("http://localhost/api/auth/logout", {
      headers: { cookie: "dr3amo_session=token123" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockRevokeWalletSessionByHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date)
    );
    expect(response.headers.get("set-cookie")).toContain("dr3amo_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(body).toEqual({
      success: true,
      data: { message: "Logged out successfully." },
      error: null,
    });
  });
});
