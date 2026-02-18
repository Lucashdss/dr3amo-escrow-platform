const mockFindUserByWalletAddress = jest.fn();

jest.mock("@/lib/users", () => ({
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
}));

import { GET } from "@/app/api/users/walletaddress/route";

describe("/api/users/walletaddress route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when walletAddress query param is missing", async () => {
    const request = new Request("http://localhost/api/users/walletaddress");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "walletAddress query param is required." });
  });

  it("returns exists=false when user is not found", async () => {
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);

    const request = new Request(
      "http://localhost/api/users/walletaddress?walletAddress=0xAbC"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith("0xabc");
    expect(response.status).toBe(200);
    expect(body).toEqual({ exists: false, user: null });
  });

  it("returns exists=true with user when found", async () => {
    const user = {
      id: 3,
      username: "alice",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
    };
    mockFindUserByWalletAddress.mockResolvedValueOnce(user);

    const request = new Request(
      "http://localhost/api/users/walletaddress?walletAddress=0xAbC"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ exists: true, user });
  });

  it("returns 500 when lookup throws", async () => {
    mockFindUserByWalletAddress.mockRejectedValueOnce(new Error("boom"));

    const request = new Request(
      "http://localhost/api/users/walletaddress?walletAddress=0xabc"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to check wallet address." });
  });
});
