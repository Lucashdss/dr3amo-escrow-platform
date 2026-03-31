function createTxHash(char: string): string {
  return `0x${char.repeat(64)}`;
}

function createTarget(overrides: Record<string, unknown> = {}) {
  return {
    chainId: 1,
    contractAddress: "0x0000000000000000000000000000000000000010",
    ...overrides,
  };
}

async function flushTasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("escrowAutomationMonitor", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    globalThis.__escrowAutomationStarted = undefined;
    globalThis.__escrowAutomationLastBlocks = new Map([[1, BigInt(100)]]);
    globalThis.__escrowAutomationProcessedKeys = undefined;
    environment.NODE_ENV = "development";
  });

  afterEach(() => {
    environment.NODE_ENV = originalNodeEnv;
    globalThis.__escrowAutomationStarted = undefined;
    globalThis.__escrowAutomationLastBlocks = undefined;
    globalThis.__escrowAutomationProcessedKeys = undefined;
    jest.restoreAllMocks();
  });

  it("polls active monitored escrows and deduplicates refund transactions", async () => {
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(105));
    const mockListRefundCandidates = jest.fn().mockResolvedValue([
      {
        contractAddress: "0x0000000000000000000000000000000000000010",
        txHash: createTxHash("a"),
      },
      {
        contractAddress: "0x0000000000000000000000000000000000000010",
        txHash: createTxHash("a"),
      },
    ]);
    const mockListActiveEscrowMonitoringTargets = jest
      .fn()
      .mockResolvedValue([createTarget()]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest.fn().mockResolvedValue(true);
    const setIntervalSpy = jest
      .spyOn(global, "setInterval")
      .mockReturnValue(0 as unknown as NodeJS.Timeout);

    jest.doMock("@/features/escrows/services/escrowContract", () => ({
      getLatestEscrowBlockNumber: (...args: unknown[]) =>
        mockGetLatestEscrowBlockNumber(...args),
      listRefundCandidates: (...args: unknown[]) => mockListRefundCandidates(...args),
    }));
    jest.doMock("@/features/escrows/server/escrowService", () => ({
      listActiveEscrowMonitoringTargets: (...args: unknown[]) =>
        mockListActiveEscrowMonitoringTargets(...args),
      reconcileActiveEscrows: (...args: unknown[]) =>
        mockReconcileActiveEscrows(...args),
      syncAutomatedRefundEscrow: (...args: unknown[]) =>
        mockSyncAutomatedRefundEscrow(...args),
    }));

    const { startEscrowAutomationMonitor } = await import(
      "@/features/escrows/server/escrowAutomationMonitor"
    );

    startEscrowAutomationMonitor();
    await flushTasks();

    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(mockListActiveEscrowMonitoringTargets).toHaveBeenCalledTimes(1);
    expect(mockGetLatestEscrowBlockNumber).toHaveBeenCalledWith(1);
    expect(mockListRefundCandidates).toHaveBeenCalledWith(
      1,
      ["0x0000000000000000000000000000000000000010"],
      BigInt(101),
      BigInt(105)
    );
    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledTimes(1);
    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledWith(
      1,
      "0x0000000000000000000000000000000000000010",
      createTxHash("a")
    );
    expect(mockReconcileActiveEscrows).toHaveBeenCalledTimes(1);
  });
});
