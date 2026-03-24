const mockFindEscrowManagementByIdForUser = jest.fn();
const mockUpdateEscrowSnapshot = jest.fn();
const mockGetEscrowSyncReceipt = jest.fn();
const mockDecodeEscrowReceiptEventNames = jest.fn();
const mockGetFundReceiptUpdate = jest.fn();
const mockGetModificationReceiptUpdate = jest.fn();
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
  getModificationReceiptUpdate: (...args: unknown[]) =>
    mockGetModificationReceiptUpdate(...args),
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
      amount: "1.5",
      modificationsRequested: 0,
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
      amount: "1.5",
      deadline: "2026-03-20",
      modificationsRequested: 0,
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
      amount: "1.5",
      deadline: "2026-03-20",
      id: 7,
      modificationsRequested: 0,
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

  it("updates the database to work submitted after markWorkSubmitted succeeds", async () => {
    const escrow = {
      id: 8,
      amount: "0.01",
      chainId: 1,
      clientUsername: "client",
      contractAddress: "0x0000000000000000000000000000000000000011",
      createdAt: "2026-03-16T00:00:00.000Z",
      deadline: "2026-03-20",
      escrowName: "Dashboard copy refresh",
      freelancerUsername: "freelancer",
      role: "freelancer",
      state: "funded",
      tokenId: 3,
    };
    const refreshedEscrow = {
      ...escrow,
      modificationsRequested: 0,
      state: "work submitted",
    };

    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockGetEscrowSyncReceipt.mockResolvedValueOnce({
      logs: [],
      status: "success",
    });
    mockDecodeEscrowReceiptEventNames.mockReturnValueOnce([]);

    const response = await POST(
      new Request("http://localhost/api/escrows/8/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "markWorkSubmitted",
          txHash: `0x${"2".repeat(64)}`,
          userId: 22,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "8" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0.01",
      deadline: "2026-03-20",
      id: 8,
      modificationsRequested: 0,
      state: "work submitted",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: `0x${"2".repeat(64)}`,
      },
      error: null,
    });
  });

  it("updates the database to dispute after initiateDispute succeeds", async () => {
    const escrow = {
      id: 9,
      amount: "0.01",
      chainId: 1,
      clientUsername: "client",
      contractAddress: "0x0000000000000000000000000000000000000012",
      createdAt: "2026-03-16T00:00:00.000Z",
      deadline: "2026-03-20",
      escrowName: "Dispute case",
      freelancerUsername: "freelancer",
      role: "client",
      state: "funded",
      tokenId: 3,
    };
    const refreshedEscrow = {
      ...escrow,
      modificationsRequested: 0,
      state: "dispute",
    };

    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockGetEscrowSyncReceipt.mockResolvedValueOnce({
      logs: [],
      status: "success",
    });
    mockDecodeEscrowReceiptEventNames.mockReturnValueOnce([]);

    const response = await POST(
      new Request("http://localhost/api/escrows/9/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "initiateDispute",
          txHash: `0x${"3".repeat(64)}`,
          userId: 11,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "9" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0.01",
      deadline: "2026-03-20",
      id: 9,
      modificationsRequested: 0,
      state: "dispute",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: `0x${"3".repeat(64)}`,
      },
      error: null,
    });
  });

  it("updates the database to released after confirmDelivery succeeds", async () => {
    const escrow = {
      id: 10,
      amount: "0.01",
      chainId: 1,
      clientUsername: "client",
      contractAddress: "0x0000000000000000000000000000000000000013",
      createdAt: "2026-03-16T00:00:00.000Z",
      deadline: "2026-03-20",
      escrowName: "Delivery confirmation",
      freelancerUsername: "freelancer",
      role: "client",
      state: "work submitted",
      tokenId: 3,
    };
    const refreshedEscrow = {
      ...escrow,
      modificationsRequested: 0,
      state: "released",
    };

    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockGetEscrowSyncReceipt.mockResolvedValueOnce({
      logs: [],
      status: "success",
    });
    mockDecodeEscrowReceiptEventNames.mockReturnValueOnce([]);

    const response = await POST(
      new Request("http://localhost/api/escrows/10/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "confirmDelivery",
          txHash: `0x${"4".repeat(64)}`,
          userId: 11,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "10" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0.01",
      deadline: "2026-03-20",
      id: 10,
      modificationsRequested: 0,
      state: "released",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: `0x${"4".repeat(64)}`,
      },
      error: null,
    });
  });

  it("updates the database to pending modification and extends the deadline", async () => {
    const escrow = {
      id: 11,
      amount: "0.01",
      chainId: 1,
      clientUsername: "client",
      contractAddress: "0x0000000000000000000000000000000000000014",
      createdAt: "2026-03-16T00:00:00.000Z",
      deadline: "2026-03-20",
      escrowName: "Modification request",
      freelancerUsername: "freelancer",
      modificationsRequested: 0,
      role: "client",
      state: "work submitted",
      tokenId: 3,
    };
    const refreshedEscrow = {
      ...escrow,
      deadline: "2026-03-23",
      modificationsRequested: 1,
      state: "pending modification",
    };

    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockGetEscrowSyncReceipt.mockResolvedValueOnce({
      logs: [],
      status: "success",
    });
    mockDecodeEscrowReceiptEventNames.mockReturnValueOnce([]);
    mockGetModificationReceiptUpdate.mockResolvedValueOnce({
      deadline: "2026-03-23",
      state: "pending modification",
    });

    const response = await POST(
      new Request("http://localhost/api/escrows/11/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "requestModificationAndUpdateDeadline",
          txHash: `0x${"5".repeat(64)}`,
          userId: 11,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "11" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0.01",
      deadline: "2026-03-23",
      id: 11,
      modificationsRequested: 1,
      state: "pending modification",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: `0x${"5".repeat(64)}`,
      },
      error: null,
    });
  });
});
