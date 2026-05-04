const mockFindEscrowManagementByIdForUser = jest.fn();
const mockUpdateEscrowSnapshot = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();
const mockVerifyEscrowActionTransaction = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowByContractAddressAndChainId: jest.fn(),
  findEscrowById: jest.fn(),
  findEscrowManagementByIdForUser: (...args: unknown[]) =>
    mockFindEscrowManagementByIdForUser(...args),
  getClientEscrowSummary: jest.fn(),
  getFreelancerEscrowSummary: jest.fn(),
  listActiveEscrowMonitoringTargets: jest.fn(),
  listEscrows: jest.fn(),
  listEscrowsForUser: jest.fn(),
  updateEscrowSnapshot: (...args: unknown[]) => mockUpdateEscrowSnapshot(...args),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  normalizeEscrowDatabaseState: (state: unknown) => state,
  isAutomationMonitoringState: jest.fn(),
  readCurrentEscrowSnapshot: jest.fn(),
  verifyCreateEscrowTransaction: jest.fn(),
  verifyEscrowActionTransaction: (...args: unknown[]) =>
    mockVerifyEscrowActionTransaction(...args),
  verifyRefundTransaction: jest.fn(),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

import { AppError } from "@/lib/errors";
import { POST } from "@/app/api/escrows/[id]/sync/route";

function createTxHash(char: string): string {
  return `0x${char.repeat(64)}`;
}

function getAuthenticatedUser(id: number) {
  return {
    id,
    username: "client",
    wallet_address: "0xabc",
    created_at: "2026-03-16T00:00:00.000Z",
  };
}

function createEscrow(state: string) {
  return {
    id: 7,
    amount: "0",
    chainId: 1,
    clientUsername: "client",
    contractAddress: "0x0000000000000000000000000000000000000010",
    createdAt: "2026-03-16T00:00:00.000Z",
    deadline: "2026-03-20",
    escrowName: "Landing page refresh",
    freelancerUsername: "freelancer",
    role: "client" as const,
    state,
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenId: 3,
  };
}

describe("/api/escrows/[id]/sync route", () => {
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

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "fund",
          txHash: createTxHash("1"),
        }),
        headers: { "Content-Type": "application/json" },
      }),
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

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "fund",
          txHash: createTxHash("2"),
        }),
        headers: { "Content-Type": "application/json" },
      }),
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

  it("returns 404 when an authenticated user tries to sync another user's escrow", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(getAuthenticatedUser(11));
    mockFindEscrowManagementByIdForUser.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "fund",
          txHash: createTxHash("3"),
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
    expect(mockVerifyEscrowActionTransaction).not.toHaveBeenCalled();
    expect(mockUpdateEscrowSnapshot).not.toHaveBeenCalled();
  });

  it("syncs a verified funding transaction and updates last_tx_hash", async () => {
    const escrow = createEscrow("created");
    const refreshedEscrow = {
      ...escrow,
      amount: "1.5",
      modificationsRequested: 0,
      state: "funded",
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce(getAuthenticatedUser(11));
    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockVerifyEscrowActionTransaction.mockResolvedValueOnce({
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
          txHash: createTxHash("4"),
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockVerifyEscrowActionTransaction).toHaveBeenCalledWith({
      action: "fund",
      authenticatedWalletAddress: "0xabc",
      escrow,
      txHash: createTxHash("4"),
    });
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "1.5",
      deadline: "2026-03-20",
      id: 7,
      lastTxHash: createTxHash("4"),
      modificationsRequested: 0,
      state: "funded",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: createTxHash("4"),
      },
      error: null,
    });
  });

  it("syncs a verified cancel transaction and updates the chain snapshot", async () => {
    const escrow = createEscrow("funded");
    const refreshedEscrow = {
      ...escrow,
      modificationsRequested: 0,
      state: "cancelled",
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce(getAuthenticatedUser(11));
    mockFindEscrowManagementByIdForUser
      .mockResolvedValueOnce(escrow)
      .mockResolvedValueOnce(refreshedEscrow);
    mockVerifyEscrowActionTransaction.mockResolvedValueOnce({
      amount: "0",
      deadline: "2026-03-20",
      modificationsRequested: 0,
      state: "cancelled",
    });

    const response = await POST(
      new Request("http://localhost/api/escrows/7/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "cancelEscrow",
          txHash: createTxHash("5"),
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0",
      deadline: "2026-03-20",
      id: 7,
      lastTxHash: createTxHash("5"),
      modificationsRequested: 0,
      state: "cancelled",
    });
    expect(body).toEqual({
      success: true,
      data: {
        escrow: refreshedEscrow,
        txHash: createTxHash("5"),
      },
      error: null,
    });
  });
});
