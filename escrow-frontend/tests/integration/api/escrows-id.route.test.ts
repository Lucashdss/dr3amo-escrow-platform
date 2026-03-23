const mockFindEscrowManagementByIdForUser = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowById: jest.fn(),
  findEscrowManagementByIdForUser: (...args: unknown[]) =>
    mockFindEscrowManagementByIdForUser(...args),
  getClientEscrowSummary: jest.fn(),
  getFreelancerEscrowSummary: jest.fn(),
  listEscrows: jest.fn(),
  listEscrowsForUser: jest.fn(),
  updateEscrowSnapshot: jest.fn(),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  decodeEscrowReceiptEventNames: jest.fn(),
  getFundReceiptUpdate: jest.fn(),
  getEscrowSyncReceipt: jest.fn(),
  readEscrowSyncSnapshot: jest.fn(),
}));

import { GET } from "@/app/api/escrows/[id]/route";

describe("/api/escrows/[id] route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when userId is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/escrows/7"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "userId query param must be a positive integer." },
    });
  });

  it("returns escrow detail for a related user", async () => {
    const escrow = {
      id: 7,
      amount: "0",
      chainId: 1,
      clientUsername: "client",
      contractAddress: "0x0000000000000000000000000000000000000010",
      createdAt: "2026-03-16T00:00:00.000Z",
      deadline: "2026-03-20",
      escrowName: "Landing page refresh",
      freelancerUsername: "freelancer",
      role: "client",
      state: "created",
      tokenId: 1,
    };

    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(escrow);

    const response = await GET(
      new Request("http://localhost/api/escrows/7?userId=11"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFindEscrowManagementByIdForUser).toHaveBeenCalledWith(7, 11);
    expect(body).toEqual({
      success: true,
      data: { escrow },
      error: null,
    });
  });

  it("returns 404 for an unrelated or missing escrow", async () => {
    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/escrows/7?userId=11"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Escrow not found." },
    });
  });

  it("returns 500 when the repository throws", async () => {
    mockFindEscrowManagementByIdForUser.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(
      new Request("http://localhost/api/escrows/7?userId=11"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to fetch escrow detail." },
    });
  });
});
