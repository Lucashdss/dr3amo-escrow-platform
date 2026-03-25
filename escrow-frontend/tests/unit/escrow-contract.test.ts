const mockReadContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockWriteContract = jest.fn();

jest.mock("@wagmi/core", () => ({
  getPublicClient: jest.fn(),
  readContract: (...args: unknown[]) => mockReadContract(...args),
  waitForTransactionReceipt: (...args: unknown[]) =>
    mockWaitForTransactionReceipt(...args),
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
}));

jest.mock("@/lib/web3/wagmi", () => ({
  config: {},
}));

import { approveEscrowFundingIfNeeded } from "@/features/escrows/services/escrowContract";

describe("approveEscrowFundingIfNeeded", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("skips approval for ETH escrows", async () => {
    const result = await approveEscrowFundingIfNeeded({
      amount: BigInt(100),
      contractAddress: "0x0000000000000000000000000000000000000010",
      databaseChainId: 1,
      tokenAddress: "0x0000000000000000000000000000000000000020",
      tokenId: 3,
      walletAddress: "0x0000000000000000000000000000000000000030",
    });

    expect(result).toBeNull();
    expect(mockReadContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(mockWaitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it("skips approval when allowance already covers the amount", async () => {
    mockReadContract.mockResolvedValueOnce(BigInt(200));

    const result = await approveEscrowFundingIfNeeded({
      amount: BigInt(100),
      contractAddress: "0x0000000000000000000000000000000000000010",
      databaseChainId: 1,
      tokenAddress: "0x0000000000000000000000000000000000000020",
      tokenId: 1,
      walletAddress: "0x0000000000000000000000000000000000000030",
    });

    expect(result).toBeNull();
    expect(mockReadContract).toHaveBeenCalledTimes(1);
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(mockWaitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it("approves the exact amount and waits for the receipt", async () => {
    const approvalHash = `0x${"1".repeat(64)}`;

    mockReadContract.mockResolvedValueOnce(BigInt(50));
    mockReadContract.mockResolvedValueOnce(BigInt(100));
    mockWriteContract.mockResolvedValueOnce(approvalHash);
    mockWaitForTransactionReceipt.mockResolvedValueOnce({});

    const result = await approveEscrowFundingIfNeeded({
      amount: BigInt(100),
      contractAddress: "0x0000000000000000000000000000000000000010",
      databaseChainId: 1,
      tokenAddress: "0x0000000000000000000000000000000000000020",
      tokenId: 1,
      walletAddress: "0x0000000000000000000000000000000000000030",
    });

    expect(mockWriteContract).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        address: "0x0000000000000000000000000000000000000020",
        args: ["0x0000000000000000000000000000000000000010", BigInt(100)],
        chainId: 8453,
        functionName: "approve",
      })
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({}, {
      chainId: 8453,
      hash: approvalHash,
    });
    expect(mockReadContract).toHaveBeenCalledTimes(2);
    expect(result).toBe(approvalHash);
  });

  it("fails when allowance is still stale after approval retries", async () => {
    jest.useFakeTimers();
    mockReadContract.mockResolvedValue(BigInt(50));
    mockWriteContract.mockResolvedValueOnce(`0x${"2".repeat(64)}`);
    mockWaitForTransactionReceipt.mockResolvedValueOnce({});

    const approvalPromise = approveEscrowFundingIfNeeded({
      amount: BigInt(100),
      contractAddress: "0x0000000000000000000000000000000000000010",
      databaseChainId: 1,
      tokenAddress: "0x0000000000000000000000000000000000000020",
      tokenId: 1,
      walletAddress: "0x0000000000000000000000000000000000000030",
    });
    const rejectionExpectation = expect(approvalPromise).rejects.toThrow(
      "Approval was confirmed but allowance is not visible yet."
    );

    await jest.runAllTimersAsync();

    await rejectionExpectation;
    expect(mockReadContract).toHaveBeenCalledTimes(6);
    jest.useRealTimers();
  });
});
