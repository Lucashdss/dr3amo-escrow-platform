const mockFindEscrowManagementByIdForUser = jest.fn();
const mockUpdateEscrowSnapshot = jest.fn();
const mockGetEscrowSyncReceipt = jest.fn();
const mockDecodeEscrowReceiptEventNames = jest.fn();
const mockGetFundReceiptUpdate = jest.fn();
const mockReadEscrowSyncSnapshot = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowById: jest.fn(),
  findEscrowManagementByIdForUser: (...args: unknown[]) =>
    mockFindEscrowManagementByIdForUser(...args),
  getClientEscrowSummary: jest.fn(),
  getFreelancerEscrowSummary: jest.fn(),
  listEscrows: jest.fn(),
  listEscrowsForUser: jest.fn(),
  updateEscrowSnapshot: (...args: unknown[]) => mockUpdateEscrowSnapshot(...args),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  decodeEscrowReceiptEventNames: (...args: unknown[]) =>
    mockDecodeEscrowReceiptEventNames(...args),
  getFundReceiptUpdate: (...args: unknown[]) => mockGetFundReceiptUpdate(...args),
  getEscrowSyncReceipt: (...args: unknown[]) => mockGetEscrowSyncReceipt(...args),
  readEscrowSyncSnapshot: (...args: unknown[]) => mockReadEscrowSyncSnapshot(...args),
}));

import { POST } from "@/app/api/escrows/[id]/sync/route";

describe("/api/escrows/[id]/sync route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 for an invalid sync payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "A valid action is required." },
    });
  });

  it("returns 404 when the escrow does not belong to the user", async () => {
    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "fund",
          txHash: `0x${"1".repeat(64)}`,
          userId: 11,
        }),
        headers: { "Content-Type": "application/json" },
      }),
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

  it("syncs a confirmed transaction and updates the escrow snapshot", async () => {
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
      tokenId: 3,
    };
    const refreshedEscrow = {
      ...escrow,
      amount: "1500000000000000000",
      state: "funded",
    };

    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockGetEscrowSyncReceipt.mockResolvedValueOnce({
      logs: [],
      status: "success",
    });
    mockDecodeEscrowReceiptEventNames.mockReturnValueOnce([]);
    mockGetFundReceiptUpdate.mockResolvedValueOnce({
      amount: "1500000000000000000",
      deadline: "2026-03-20",
      state: "funded",
    });

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "fund",
          txHash: `0x${"1".repeat(64)}`,
          userId: 11,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "1500000000000000000",
      deadline: "2026-03-20",
      id: 7,
      state: "funded",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: `0x${"1".repeat(64)}`,
      },
      error: null,
    });
  });
});
