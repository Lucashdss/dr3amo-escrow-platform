import { encodeFunctionData } from "viem";

const mockGetPublicClient = jest.fn();
const mockReadContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockWriteContract = jest.fn();

jest.mock("@wagmi/core", () => ({
  getPublicClient: (...args: unknown[]) => mockGetPublicClient(...args),
  readContract: (...args: unknown[]) => mockReadContract(...args),
  waitForTransactionReceipt: (...args: unknown[]) =>
    mockWaitForTransactionReceipt(...args),
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
}));

jest.mock("@/lib/web3/wagmi", () => ({
  config: {},
}));

import {
  approveEscrowFundingIfNeeded,
  getModificationReceiptUpdate,
} from "@/features/escrows/services/escrowContract";

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

describe("getModificationReceiptUpdate", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("extends a date-only deadline", async () => {
    mockGetPublicClient.mockReturnValue({
      getTransaction: jest.fn().mockResolvedValue({
        input: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "requestModificationAndUpdateDeadline",
              inputs: [
                {
                  internalType: "uint256",
                  name: "deadlineExtension",
                  type: "uint256",
                },
              ],
              outputs: [],
              stateMutability: "nonpayable",
            },
          ],
          functionName: "requestModificationAndUpdateDeadline",
          args: [BigInt(3)],
        }),
      }),
    });

    const result = await getModificationReceiptUpdate(
      {
        amount: "0.01",
        chainId: 1,
        clientUsername: "client",
        contractAddress: "0x0000000000000000000000000000000000000010",
        createdAt: "2026-03-16T00:00:00.000Z",
        deadline: "2026-03-20",
        escrowName: "Modification request",
        freelancerUsername: "freelancer",
        id: 11,
        modificationsRequested: 0,
        role: "client",
        state: "work submitted",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        tokenId: 3,
      },
      `0x${"5".repeat(64)}`
    );

    expect(result).toEqual({
      deadline: "2026-03-23",
      state: "pending modification",
    });
  });

  it("extends a stored datetime deadline", async () => {
    mockGetPublicClient.mockReturnValue({
      getTransaction: jest.fn().mockResolvedValue({
        input: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "requestModificationAndUpdateDeadline",
              inputs: [
                {
                  internalType: "uint256",
                  name: "deadlineExtension",
                  type: "uint256",
                },
              ],
              outputs: [],
              stateMutability: "nonpayable",
            },
          ],
          functionName: "requestModificationAndUpdateDeadline",
          args: [BigInt(2)],
        }),
      }),
    });

    const result = await getModificationReceiptUpdate(
      {
        amount: "0.01",
        chainId: 1,
        clientUsername: "client",
        contractAddress: "0x0000000000000000000000000000000000000010",
        createdAt: "2026-03-16T00:00:00.000Z",
        deadline: "2026-03-20 00:00:00",
        escrowName: "Modification request",
        freelancerUsername: "freelancer",
        id: 11,
        modificationsRequested: 0,
        role: "client",
        state: "work submitted",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        tokenId: 3,
      },
      `0x${"6".repeat(64)}`
    );

    expect(result).toEqual({
      deadline: "2026-03-22",
      state: "pending modification",
    });
  });

  it("extends a stored Date deadline", async () => {
    mockGetPublicClient.mockReturnValue({
      getTransaction: jest.fn().mockResolvedValue({
        input: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "requestModificationAndUpdateDeadline",
              inputs: [
                {
                  internalType: "uint256",
                  name: "deadlineExtension",
                  type: "uint256",
                },
              ],
              outputs: [],
              stateMutability: "nonpayable",
            },
          ],
          functionName: "requestModificationAndUpdateDeadline",
          args: [BigInt(4)],
        }),
      }),
    });

    const result = await getModificationReceiptUpdate(
      {
        amount: "0.01",
        chainId: 1,
        clientUsername: "client",
        contractAddress: "0x0000000000000000000000000000000000000010",
        createdAt: "2026-03-16T00:00:00.000Z",
        deadline: new Date("2026-03-20T00:00:00.000Z") as unknown as string,
        escrowName: "Modification request",
        freelancerUsername: "freelancer",
        id: 11,
        modificationsRequested: 0,
        role: "client",
        state: "work submitted",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        tokenId: 3,
      },
      `0x${"7".repeat(64)}`
    );

    expect(result).toEqual({
      deadline: "2026-03-24",
      state: "pending modification",
    });
  });
});
