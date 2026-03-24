const mockCreateEscrowRecord = jest.fn();
const mockFindEscrowById = jest.fn();
const mockFindUserByWalletAddress = jest.fn();
const mockListEscrows = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: (...args: unknown[]) => mockCreateEscrowRecord(...args),
  findEscrowById: (...args: unknown[]) => mockFindEscrowById(...args),
  listEscrows: (...args: unknown[]) => mockListEscrows(...args),
}));

jest.mock("@/features/auth/server/userRepository", () => ({
  findUserByWalletAddress: (...args: unknown[]) =>
    mockFindUserByWalletAddress(...args),
}));

jest.mock("@/features/escrows/services/escrowContract", () => ({
  decodeEscrowReceiptEventNames: jest.fn(),
  getFundReceiptUpdate: jest.fn(),
  getModificationReceiptUpdate: jest.fn(),
  getEscrowSyncReceipt: jest.fn(),
  readEscrowSyncSnapshot: jest.fn(),
}));

import { GET, POST } from "@/app/api/escrows/route";

describe("/api/escrows route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("GET returns escrows list", async () => {
    const escrows = [
      {
        id: 1,
        contract_address: "0xabc",
        escrow_name: "Landing page refresh",
        client_id: 1,
        freelancer_id: 2,
        token_id: 2,
        chain_id: 8453,
        amount: "0",
        deadline: "2026-03-20",
        state: "created",
        created_at: "2026-03-16T00:00:00.000Z",
      },
    ];

    mockListEscrows.mockResolvedValueOnce(escrows);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { escrows },
      error: null,
    });
  });

  it("POST validates required fields", async () => {
    const request = new Request("http://localhost/api/escrows", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "chainKey must be base or baseSepolia." },
    });
  });

  it("POST rejects unregistered users", async () => {
    mockFindUserByWalletAddress.mockResolvedValueOnce(null);
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 2,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
      created_at: "2026-03-16T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/escrows", {
      method: "POST",
      body: JSON.stringify({
        amount: "0",
        chainKey: "base",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Client wallet is not registered." },
    });
  });

  it("POST persists a Base mainnet escrow with fixed foreign-key ids", async () => {
    const clientUser = {
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
      created_at: "2026-03-16T00:00:00.000Z",
    };
    const freelancerUser = {
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
      created_at: "2026-03-16T00:00:00.000Z",
    };
    const escrow = {
      id: 7,
      contract_address: "0x0000000000000000000000000000000000000010",
      escrow_name: "Landing page refresh",
      client_id: 11,
      freelancer_id: 22,
      token_id: 1,
      chain_id: 1,
      amount: "0",
      deadline: "2026-03-20",
      state: "created",
      created_at: "2026-03-16T00:00:00.000Z",
    };

    mockFindUserByWalletAddress.mockResolvedValueOnce(clientUser);
    mockFindUserByWalletAddress.mockResolvedValueOnce(freelancerUser);
    mockCreateEscrowRecord.mockResolvedValueOnce(7);
    mockFindEscrowById.mockResolvedValueOnce(escrow);

    const request = new Request("http://localhost/api/escrows", {
      method: "POST",
      body: JSON.stringify({
        amount: "0",
        chainKey: "base",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateEscrowRecord).toHaveBeenCalledWith({
      amount: "0",
      chainId: 1,
      clientId: 11,
      contractAddress: "0x0000000000000000000000000000000000000010",
      deadline: "2026-03-20",
      escrowName: "Landing page refresh",
      freelancerId: 22,
      modificationsRequested: 0,
      state: "created",
      tokenId: 1,
    });
    expect(body).toEqual({
      success: true,
      data: {
        message: "Escrow persisted successfully.",
        escrow,
        txHash: "0x1234",
      },
      error: null,
    });
  });

  it("POST persists a Base Sepolia USDC escrow with the testnet token id", async () => {
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockCreateEscrowRecord.mockResolvedValueOnce(8);
    mockFindEscrowById.mockResolvedValueOnce({
      id: 8,
      contract_address: "0x0000000000000000000000000000000000000011",
      escrow_name: "Platform migration",
      client_id: 11,
      freelancer_id: 22,
      token_id: 2,
      chain_id: 2,
      amount: "0",
      deadline: "2026-03-20",
      state: "created",
      created_at: "2026-03-16T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/escrows", {
      method: "POST",
      body: JSON.stringify({
        amount: "0",
        chainKey: "baseSepolia",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000011",
        deadline: "2026-03-20",
        escrowName: "Platform migration",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x9999",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateEscrowRecord).toHaveBeenCalledWith({
      amount: "0",
      chainId: 2,
      clientId: 11,
      contractAddress: "0x0000000000000000000000000000000000000011",
      deadline: "2026-03-20",
      escrowName: "Platform migration",
      freelancerId: 22,
      modificationsRequested: 0,
      state: "created",
      tokenId: 2,
    });
    expect(body).toEqual({
      success: true,
      data: {
        message: "Escrow persisted successfully.",
        escrow: {
          id: 8,
          contract_address: "0x0000000000000000000000000000000000000011",
          escrow_name: "Platform migration",
          client_id: 11,
          freelancer_id: 22,
          token_id: 2,
          chain_id: 2,
          amount: "0",
          deadline: "2026-03-20",
          state: "created",
          created_at: "2026-03-16T00:00:00.000Z",
        },
        txHash: "0x9999",
      },
      error: null,
    });
  });

  it("POST returns 500 when the repository insert fails", async () => {
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 11,
      username: "client",
      wallet_address: "0x0000000000000000000000000000000000000001",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockFindUserByWalletAddress.mockResolvedValueOnce({
      id: 22,
      username: "freelancer",
      wallet_address: "0x0000000000000000000000000000000000000002",
      created_at: "2026-03-16T00:00:00.000Z",
    });
    mockCreateEscrowRecord.mockRejectedValueOnce(new Error("db down"));

    const request = new Request("http://localhost/api/escrows", {
      method: "POST",
      body: JSON.stringify({
        amount: "0",
        chainKey: "baseSepolia",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "Infrastructure handoff",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "ETH",
        txHash: "0x1234",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to create escrow record." },
    });
  });
});
