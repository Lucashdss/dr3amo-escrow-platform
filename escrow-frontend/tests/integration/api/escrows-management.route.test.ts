const mockListEscrowsForUser = jest.fn();

jest.mock("@/features/escrows/server/escrowRepository", () => ({
  createEscrowRecord: jest.fn(),
  findEscrowById: jest.fn(),
  findEscrowManagementByIdForUser: jest.fn(),
  getClientEscrowSummary: jest.fn(),
  getFreelancerEscrowSummary: jest.fn(),
  listEscrows: jest.fn(),
  listEscrowsForUser: (...args: unknown[]) => mockListEscrowsForUser(...args),
}));

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

  it("returns 400 when userId is missing", async () => {
    const request = new Request("http://localhost/api/escrows/management");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "userId query param must be a positive integer." },
    });
  });

  it("returns escrows related to the user", async () => {
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
        role: "client_and_freelancer",
        state: "work submitted",
        tokenId: 3,
      },
    ];

    mockListEscrowsForUser.mockResolvedValueOnce(escrows);

    const response = await GET(
      new Request("http://localhost/api/escrows/management?userId=7")
    );
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
    mockListEscrowsForUser.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(
      new Request("http://localhost/api/escrows/management?userId=7")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to fetch related escrows." },
    });
  });
});
