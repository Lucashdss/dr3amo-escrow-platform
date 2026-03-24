const mockGetClientEscrowSummary = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowById: jest.fn(),
  getClientEscrowSummary: (...args: unknown[]) =>
    mockGetClientEscrowSummary(...args),
  listEscrows: jest.fn(),
}));

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

  it("returns 400 when clientId query param is missing", async () => {
    const request = new Request("http://localhost/api/escrows/client-funds");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: {
        message: "clientId query param must be a positive integer.",
      },
    });
  });

  it("returns the active contract count and total amount for the client", async () => {
    mockGetClientEscrowSummary.mockResolvedValueOnce({
      activeContractsCount: 4,
      deadlinesApproachingCount: 1,
      completedContractsCount: 3,
      ethAmount: "0.45",
      pendingReviewsCount: 2,
      totalAmount: "1250.50",
      usdcAmount: "1250.50",
    });

    const request = new Request(
      "http://localhost/api/escrows/client-funds?clientId=7"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetClientEscrowSummary).toHaveBeenCalledWith(7, {
      activeExcluded: ["cancelled", "released", "refunded"],
      completed: ["cancelled", "released", "refunded"],
      pendingReview: ["work submitted"],
    });
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
    mockGetClientEscrowSummary.mockRejectedValueOnce(new Error("db down"));
    const request = new Request(
      "http://localhost/api/escrows/client-funds?clientId=7"
    );

    const response = await GET(request);
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
