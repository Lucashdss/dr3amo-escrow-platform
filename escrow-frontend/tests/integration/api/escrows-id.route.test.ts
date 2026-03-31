const mockFindEscrowManagementByIdForUser = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();

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
  getModificationReceiptUpdate: jest.fn(),
  getEscrowSyncReceipt: jest.fn(),
  readEscrowSyncSnapshot: jest.fn(),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
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

  it("returns 401 when the user is not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Authentication required.", 401)
    );

    const response = await GET(
      new Request("http://localhost/api/escrows/7"),
      { params: Promise.resolve({ id: "7" }) }
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
      new Request("http://localhost/api/escrows/7"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Registered user required." },
    });
  });

  it("returns escrow detail for the authenticated related user", async () => {
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
      tokenAddress: "0x0000000000000000000000000000000000000020",
      tokenId: 1,
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 11,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(escrow);

    const response = await GET(
      new Request("http://localhost/api/escrows/7"),
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

  it("returns 404 when an authenticated user requests another user's escrow", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 11,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/escrows/7"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Escrow not found." },
    });
    expect(mockFindEscrowManagementByIdForUser).toHaveBeenCalledWith(7, 11);
  });

  it("returns 500 when the repository throws", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      id: 11,
      username: "client",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockFindEscrowManagementByIdForUser.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(
      new Request("http://localhost/api/escrows/7"),
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
