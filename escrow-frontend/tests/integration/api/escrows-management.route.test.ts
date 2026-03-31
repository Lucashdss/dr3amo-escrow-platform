const mockListEscrowsForUser = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowById: jest.fn(),
  findEscrowManagementByIdForUser: jest.fn(),
  getClientEscrowSummary: jest.fn(),
  getFreelancerEscrowSummary: jest.fn(),
  listEscrows: jest.fn(),
  listEscrowsForUser: (...args: unknown[]) => mockListEscrowsForUser(...args),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  approveEscrowFundingIfNeeded: jest.fn(),
  decodeEscrowReceiptEventNames: jest.fn(),
  executeEscrowAction: jest.fn(),
  getFundReceiptUpdate: jest.fn(),
  getModificationReceiptUpdate: jest.fn(),
  getEscrowSyncReceipt: jest.fn(),
  getSupportedChainIdForEscrow: jest.fn(),
  readEscrowLiveSnapshot: jest.fn(),
  readEscrowLiveState: jest.fn(),
  readEscrowSyncSnapshot: jest.fn(),
  waitForEscrowActionReceipt: jest.fn(),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
import { GET } from "@/app/api/escrows/management/route";

describe("/api/escrows/management route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Authentication required.", 401)
    );

    const response = await GET(new Request("http://localhost/api/escrows/management"));
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

    const response = await GET(new Request("http://localhost/api/escrows/management"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Registered user required." },
    });
  });

  it("returns escrows related to the authenticated user", async () => {
    const escrows = [
      {
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
        tokenAddress: "0x0000000000000000000000000000000000000020",
        tokenId: 1,
      },
      {
        id: 8,
        amount: "5",
        chainId: 2,
        clientUsername: "client",
        contractAddress: "0x0000000000000000000000000000000000000011",
        createdAt: "2026-03-17T00:00:00.000Z",
        deadline: "2026-03-24",
        escrowName: "Handoff audit",
        freelancerUsername: "client",
        role: "client",
        state: "work submitted",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        tokenId: 3,
      },
    ];

    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 7,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockListEscrowsForUser.mockResolvedValueOnce(escrows);

    const response = await GET(new Request("http://localhost/api/escrows/management"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockListEscrowsForUser).toHaveBeenCalledWith(7);
    expect(body).toEqual({
      success: true,
      data: { escrows },
      error: null,
    });
  });

  it("returns 500 when the repository throws", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 7,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockListEscrowsForUser.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(new Request("http://localhost/api/escrows/management"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to fetch related escrows." },
    });
  });
});
