import { parseCreateEscrowRequest } from "@/features/escrows/server/escrowRequests";

describe("parseCreateEscrowRequest", () => {
  it("parses a valid escrow payload", () => {
    const result = parseCreateEscrowRequest({
      amount: "0",
      chainKey: "base",
      clientWalletAddress: "0x0000000000000000000000000000000000000001",
      contractAddress: "0x0000000000000000000000000000000000000010",
      deadline: "2026-03-20",
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
});
