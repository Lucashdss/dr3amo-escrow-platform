const mockCreateEscrowRecord = jest.fn();
const mockFindEscrowById = jest.fn();
const mockFindUserByWalletAddress = jest.fn();
const mockRequireAuthenticatedUser = jest.fn();
const mockVerifyCreateEscrowTransaction = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: (...args: unknown[]) => mockCreateEscrowRecord(...args),
  findEscrowByContractAddressAndChainId: jest.fn(),
  findEscrowById: (...args: unknown[]) => mockFindEscrowById(...args),
  listActiveEscrowMonitoringTargets: jest.fn(),
  listEscrows: jest.fn(),
}));

jest.mock("@/features/auth/server/userRepository", () => ({
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  getLatestEscrowBlockNumber: jest.fn(),
  isAutomationMonitoringState: jest.fn(),
  listRefundCandidates: jest.fn(),
  readCurrentEscrowSnapshot: jest.fn(),
  verifyCreateEscrowTransaction: (...args: unknown[]) =>
    mockVerifyCreateEscrowTransaction(...args),
  verifyEscrowActionTransaction: jest.fn(),
  verifyRefundTransaction: jest.fn(),
}));

import { AppError } from "@/lib/errors";
import * as routeModule from "@/app/api/escrows/route";

const { POST } = routeModule;

function createTxHash(char: string): string {
  return `0x${char.repeat(64)}`;
}

describe("/api/escrows route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-16T12:00:00.000Z"));
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it("does not export a public GET handler", () => {
    expect("GET" in routeModule).toBe(false);
  });

  it("POST validates required fields", async () => {
    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "chainKey must be base or baseSepolia." },
      success: false,
    });
  });

  it("POST rejects invalid delivery periods", async () => {
    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "base",
        deliveryDays: "four",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("f"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "deliveryDays must be a positive integer." },
      success: false,
    });
  });

  it("POST returns 401 when the user is not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Authentication required.", 401)
    );

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "base",
        deliveryDays: 4,
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("1"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      data: null,
      error: { message: "Authentication required." },
      success: false,
    });
  });

  it("POST returns 403 when the session has no linked user", async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(
      new AppError("Registered user required.", 403)
    );

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "base",
        deliveryDays: 4,
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("2"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      data: null,
      error: { message: "Registered user required." },
      success: false,
    });
  });

  it("POST rejects an unregistered authenticated client wallet", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({
      created_at: "2026-03-16T00:00:00.000Z",
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
    });
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      created_at: "2026-03-16T00:00:00.000Z",
      id: 2,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
    });

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "base",
        deliveryDays: 4,
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("3"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockFindUserByWalletAddress).toHaveBeenCalledWith(
      "0x0000000000000000000000000000000000000001"
    );
    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "Client wallet is not registered." },
      success: false,
    });
  });

  it("POST persists a Base mainnet escrow using the authenticated client wallet", async () => {
    const txHash = createTxHash("4");
    const clientUser = {
      created_at: "2026-03-16T00:00:00.000Z",
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
    };
    const freelancerUser = {
      created_at: "2026-03-16T00:00:00.000Z",
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
    };
    const escrow = {
      amount: "0",
      chain_id: 1,
      client_id: 11,
      contract_address: "0x0000000000000000000000000000000000000010",
      created_at: "2026-03-16T00:00:00.000Z",
      created_tx_hash: txHash,
      deadline: "2026-03-20",
      escrow_name: "Landing page refresh",
      freelancer_id: 22,
      id: 7,
      last_tx_hash: txHash,
      state: "created",
      token_id: 1,
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce(freelancerUser);
    mockVerifyCreateEscrowTransaction.mockResolvedValueOnce({
      contractAddress: "0x0000000000000000000000000000000000000010",
      snapshot: {
        amount: "0",
        deadline: "2026-03-20",
        modificationsRequested: 0,
        state: "created",
      },
    });
    mockCreateEscrowRecord.mockResolvedValueOnce(7);
    mockFindEscrowById.mockResolvedValueOnce(escrow);

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "base",
        deliveryDays: 4,
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockFindUserByWalletAddress).toHaveBeenNthCalledWith(
      1,
      "0x0000000000000000000000000000000000000001"
    );
    expect(mockCreateEscrowRecord).toHaveBeenCalledWith({
      amount: "0",
      chainId: 1,
      clientId: 11,
      contractAddress: "0x0000000000000000000000000000000000000010",
      createdTxHash: txHash,
      deadline: "2026-03-20",
      escrowName: "Landing page refresh",
      freelancerId: 22,
      lastTxHash: txHash,
      modificationsRequested: 0,
      state: "created",
      tokenId: 1,
    });
    expect(body).toEqual({
      data: {
        escrow,
        message: "Escrow persisted successfully.",
        txHash,
      },
      error: null,
      success: true,
    });
  });

  it("POST persists a Base Sepolia USDC escrow with the testnet token id", async () => {
    const txHash = createTxHash("5");
    const clientUser = {
      created_at: "2026-03-16T00:00:00.000Z",
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
    };
    const escrow = {
      amount: "0",
      chain_id: 2,
      client_id: 11,
      contract_address: "0x0000000000000000000000000000000000000011",
      created_at: "2026-03-16T00:00:00.000Z",
      created_tx_hash: txHash,
      deadline: "2026-03-20",
      escrow_name: "Platform migration",
      freelancer_id: 22,
      id: 8,
      last_tx_hash: txHash,
      state: "created",
      token_id: 2,
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      created_at: "2026-03-16T00:00:00.000Z",
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
    });
    mockVerifyCreateEscrowTransaction.mockResolvedValueOnce({
      contractAddress: "0x0000000000000000000000000000000000000011",
      snapshot: {
        amount: "0",
        deadline: "2026-03-20",
        modificationsRequested: 0,
        state: "created",
      },
    });
    mockCreateEscrowRecord.mockResolvedValueOnce(8);
    mockFindEscrowById.mockResolvedValueOnce(escrow);

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "baseSepolia",
        deliveryDays: 4,
        escrowName: "Platform migration",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateEscrowRecord).toHaveBeenCalledWith({
      amount: "0",
      chainId: 2,
      clientId: 11,
      contractAddress: "0x0000000000000000000000000000000000000011",
      createdTxHash: txHash,
      deadline: "2026-03-20",
      escrowName: "Platform migration",
      freelancerId: 22,
      lastTxHash: txHash,
      modificationsRequested: 0,
      state: "created",
      tokenId: 2,
    });
    expect(body).toEqual({
      data: {
        escrow,
        message: "Escrow persisted successfully.",
        txHash,
      },
      error: null,
      success: true,
    });
  });

  it("POST returns 500 when the repository insert fails", async () => {
    const clientUser = {
      created_at: "2026-03-16T00:00:00.000Z",
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
    };

    mockRequireAuthenticatedUser.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      created_at: "2026-03-16T00:00:00.000Z",
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
    });
    mockVerifyCreateEscrowTransaction.mockResolvedValueOnce({
      contractAddress: "0x0000000000000000000000000000000000000010",
      snapshot: {
        amount: "0",
        deadline: "2026-03-20",
        modificationsRequested: 0,
        state: "created",
      },
    });
    mockCreateEscrowRecord.mockRejectedValueOnce(new Error("db down"));

    const request = new Request("http://localhost/api/escrows", {
      body: JSON.stringify({
        chainKey: "baseSepolia",
        deliveryDays: 4,
        escrowName: "Infrastructure handoff",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "ETH",
        txHash: createTxHash("6"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { message: "Failed to create escrow record." },
      success: false,
    });
  });
});
