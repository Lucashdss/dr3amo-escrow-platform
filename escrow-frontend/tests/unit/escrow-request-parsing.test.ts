import { parseCreateEscrowRequest } from "@/features/escrows/server/escrowRequests";

describe("parseCreateEscrowRequest", () => {
  it("parses a valid escrow payload", () => {
    const result = parseCreateEscrowRequest({
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
    });

    expect(result).toEqual({
      success: true,
      data: {
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
      },
    });
  });

  it("rejects invalid contract addresses", () => {
    expect(
      parseCreateEscrowRequest({
        amount: "0",
        chainKey: "base",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "not-an-address",
        deadline: "2026-03-20",
        escrowName: "Website redesign",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      })
    ).toEqual({
      success: false,
      error: "A valid contractAddress is required.",
    });
  });

  it("rejects blank escrow names", () => {
    expect(
      parseCreateEscrowRequest({
        amount: "0",
        chainKey: "base",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "   ",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      })
    ).toEqual({
      success: false,
      error: "escrowName is required.",
    });
  });

  it("rejects escrow names longer than 50 characters", () => {
    expect(
      parseCreateEscrowRequest({
        amount: "0",
        chainKey: "base",
        clientWalletAddress: "0x0000000000000000000000000000000000000001",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "a".repeat(51),
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      })
    ).toEqual({
      success: false,
      error: "escrowName must be 50 characters or fewer.",
    });
  });
});
