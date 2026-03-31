import { parseCreateEscrowRequest } from "@/features/escrows/server/escrowRequests";

function createTxHash(char: string): string {
  return `0x${char.repeat(64)}`;
}

describe("parseCreateEscrowRequest", () => {
  it("parses a valid escrow payload", () => {
    const result = parseCreateEscrowRequest({
      chainKey: "base",
      deadline: "2026-03-20",
      escrowName: "Landing page refresh",
      freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
      tokenSymbol: "USDC",
      txHash: createTxHash("1"),
    });

    expect(result).toEqual({
      success: true,
      data: {
        chainKey: "base",
        deadline: "2026-03-20",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("1"),
      },
    });
  });

  it("rejects removed chain-derived fields", () => {
    expect(
      parseCreateEscrowRequest({
        amount: "0",
        chainKey: "base",
        contractAddress: "0x0000000000000000000000000000000000000010",
        deadline: "2026-03-20",
        escrowName: "Website redesign",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        state: "created",
        tokenSymbol: "USDC",
        txHash: createTxHash("2"),
      })
    ).toEqual({
      success: false,
      error: "contractAddress, amount, and state are derived from chain data.",
    });
  });

  it("rejects blank escrow names", () => {
    expect(
      parseCreateEscrowRequest({
        chainKey: "base",
        deadline: "2026-03-20",
        escrowName: "   ",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("3"),
      })
    ).toEqual({
      success: false,
      error: "escrowName is required.",
    });
  });

  it("rejects escrow names longer than 50 characters", () => {
    expect(
      parseCreateEscrowRequest({
        chainKey: "base",
        deadline: "2026-03-20",
        escrowName: "a".repeat(51),
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: createTxHash("4"),
      })
    ).toEqual({
      success: false,
      error: "escrowName must be 50 characters or fewer.",
    });
  });

  it("rejects invalid freelancer wallet addresses", () => {
    expect(
      parseCreateEscrowRequest({
        chainKey: "base",
        deadline: "2026-03-20",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "not-an-address",
        tokenSymbol: "USDC",
        txHash: createTxHash("5"),
      })
    ).toEqual({
      success: false,
      error: "A valid freelancerWalletAddress is required.",
    });
  });

  it("rejects invalid tx hashes", () => {
    expect(
      parseCreateEscrowRequest({
        chainKey: "base",
        deadline: "2026-03-20",
        escrowName: "Landing page refresh",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        tokenSymbol: "USDC",
        txHash: "0x1234",
      })
    ).toEqual({
      success: false,
      error: "A valid txHash is required.",
    });
  });
});
