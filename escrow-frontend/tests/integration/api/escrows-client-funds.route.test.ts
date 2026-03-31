const mockGetClientEscrowSummary = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();

jest.mock("@/features/escrows/server/escrowService", () => ({
  getClientEscrowSummary: (...args: unknown[]) =>
    mockGetClientEscrowSummary(...args),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
import { GET } from "@/app/api/escrows/client-funds/route";

describe("/api/escrows/client-funds route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 without an authenticated user", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Authentication required.", 401)
    );

    const response = await GET(new Request("http://localhost/api/escrows/client-funds"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Authentication required." },
    });
  });

  it("returns 403 when the session has no linked user", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Registered user required.", 403)
    );

    const response = await GET(new Request("http://localhost/api/escrows/client-funds"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Registered user required." },
    });
  });

  it("returns the active contract count and total amount for the authenticated client", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 7,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockGetClientEscrowSummary.mockResolvedValueOnce({
      activeContractsCount: 4,
      deadlinesApproachingCount: 1,
      completedContractsCount: 3,
      ethAmount: "0.45",
      pendingReviewsCount: 2,
      totalAmount: "1250.50",
      usdcAmount: "1250.50",
    });

    const response = await GET(new Request("http://localhost/api/escrows/client-funds"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetClientEscrowSummary).toHaveBeenCalledWith(7);
    expect(body).toEqual({
      success: true,
      data: {
        activeContractsCount: 4,
        deadlinesApproachingCount: 1,
        completedContractsCount: 3,
        ethAmount: "0.45",
        pendingReviewsCount: 2,
        totalAmount: "1250.50",
        usdcAmount: "1250.50",
      },
      error: null,
    });
  });

  it("returns 500 when the repository lookup fails", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 7,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockGetClientEscrowSummary.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(new Request("http://localhost/api/escrows/client-funds"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: {
        message: "Failed to fetch client escrow funds.",
      },
    });
  });
});
