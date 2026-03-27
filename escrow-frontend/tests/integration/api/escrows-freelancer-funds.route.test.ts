const mockGetFreelancerEscrowSummary = jest.fn();

jest.mock("@/features/escrows/server/escrowService", () => ({
  getFreelancerEscrowSummary: (...args: unknown[]) =>
    mockGetFreelancerEscrowSummary(...args),
}));

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

  it("returns 400 when freelancerId query param is missing", async () => {
    const request = new Request("http://localhost/api/escrows/freelancer-funds");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: {
        message: "freelancerId query param must be a positive integer.",
      },
    });
  });

  it("returns the receivable total for the freelancer", async () => {
    mockGetFreelancerEscrowSummary.mockResolvedValueOnce({
      activeContractsCount: 6,
      completedContractsCount: 4,
      deadlinesApproachingCount: 2,
      ethAmount: "1.2",
      totalAmount: "4200.00",
      usdcAmount: "4200.00",
      waitingDeliveriesCount: 5,
    });

    const request = new Request(
      "http://localhost/api/escrows/freelancer-funds?freelancerId=9"
    );

    const response = await GET(request);
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
    mockGetFreelancerEscrowSummary.mockRejectedValueOnce(new Error("db down"));
    const request = new Request(
      "http://localhost/api/escrows/freelancer-funds?freelancerId=9"
    );

    const response = await GET(request);
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
