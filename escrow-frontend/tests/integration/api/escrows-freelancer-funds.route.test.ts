const mockGetFreelancerEscrowSummary = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();

jest.mock("@/features/escrows/server/escrowService", () => ({
  getFreelancerEscrowSummary: (...args: unknown[]) =>
    mockGetFreelancerEscrowSummary(...args),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
import { GET } from "@/app/api/escrows/freelancer-funds/route";

describe("/api/escrows/freelancer-funds route", () => {
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

    const response = await GET(
      new Request("http://localhost/api/escrows/freelancer-funds")
    );
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

    const response = await GET(
      new Request("http://localhost/api/escrows/freelancer-funds")
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Registered user required." },
    });
  });

  it("returns the receivable total for the authenticated freelancer", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 9,
      username: "freelancer",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockGetFreelancerEscrowSummary.mockResolvedValueOnce({
      activeContractsCount: 6,
      completedContractsCount: 4,
      deadlinesApproachingCount: 2,
      ethAmount: "1.2",
      totalAmount: "4200.00",
      usdcAmount: "4200.00",
      waitingDeliveriesCount: 5,
    });

    const response = await GET(
      new Request("http://localhost/api/escrows/freelancer-funds")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetFreelancerEscrowSummary).toHaveBeenCalledWith(9);
    expect(body).toEqual({
      success: true,
      data: {
        activeContractsCount: 6,
        completedContractsCount: 4,
        deadlinesApproachingCount: 2,
        ethAmount: "1.2",
        totalAmount: "4200.00",
        usdcAmount: "4200.00",
        waitingDeliveriesCount: 5,
      },
      error: null,
    });
  });

  it("returns 500 when the repository lookup fails", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 9,
      username: "freelancer",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockGetFreelancerEscrowSummary.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(
      new Request("http://localhost/api/escrows/freelancer-funds")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: {
        message: "Failed to fetch freelancer escrow funds.",
      },
    });
  });
});
