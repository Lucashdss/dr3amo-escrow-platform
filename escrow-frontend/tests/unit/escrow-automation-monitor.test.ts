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

function createMonitorState(lastProcessedBlock: bigint) {
  return {
    chainId: 1,
    lastProcessedBlock,
  };
}

async function flushTasks() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function getProcessedKey(txHash: string, contractAddress: string): string {
  return `1:${txHash}:${contractAddress.toLowerCase()}`;
}

function mockAutomationMonitorDependencies({
  findMonitorStateByChainId,
  getLatestEscrowBlockNumber,
  listActiveEscrowMonitoringTargets,
  listRefundCandidates,
  reconcileActiveEscrows,
  syncAutomatedRefundEscrow,
  upsertMonitorState,
}: {
  findMonitorStateByChainId: jest.Mock;
  getLatestEscrowBlockNumber: jest.Mock;
  listActiveEscrowMonitoringTargets: jest.Mock;
  listRefundCandidates: jest.Mock;
  reconcileActiveEscrows: jest.Mock;
  syncAutomatedRefundEscrow: jest.Mock;
  upsertMonitorState: jest.Mock;
}) {
  jest.doMock("@/features/escrows/services/escrowContract", () => ({
    getLatestEscrowBlockNumber: (...args: unknown[]) =>
      getLatestEscrowBlockNumber(...args),
    listRefundCandidates: (...args: unknown[]) => listRefundCandidates(...args),
  }));
  jest.doMock("@/features/escrows/server/escrowService", () => ({
    listActiveEscrowMonitoringTargets: (...args: unknown[]) =>
      listActiveEscrowMonitoringTargets(...args),
    reconcileActiveEscrows: (...args: unknown[]) => reconcileActiveEscrows(...args),
    syncAutomatedRefundEscrow: (...args: unknown[]) =>
      syncAutomatedRefundEscrow(...args),
  }));
  jest.doMock("@/features/escrows/server/escrowRepository", () => ({
    findMonitorStateByChainId: (...args: unknown[]) =>
      findMonitorStateByChainId(...args),
    upsertMonitorState: (...args: unknown[]) => upsertMonitorState(...args),
  }));
}

async function startMonitor() {
  const { startEscrowAutomationMonitor } = await import(
    "@/features/escrows/server/escrowAutomationMonitor"
  );

  startEscrowAutomationMonitor();
  await flushTasks();
}

function getPollCallback(): () => void {
  return (setInterval as jest.Mock).mock.calls[0][0] as () => void;
}

describe("escrowAutomationMonitor", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalAutomationFlag = process.env.ENABLE_ESCROW_AUTOMATION;
  const originalNextRuntime = process.env.NEXT_RUNTIME;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    globalThis.__escrowAutomationStarted = undefined;
    globalThis.__escrowAutomationProcessedKeys = undefined;
    globalThis.__escrowAutomationRetryCounts = undefined;
    environment.ENABLE_ESCROW_AUTOMATION = "true";
    environment.NEXT_RUNTIME = "nodejs";
    environment.NODE_ENV = "development";
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest
      .spyOn(global, "setInterval")
      .mockReturnValue(0 as unknown as NodeJS.Timeout);
  });

  afterEach(() => {
    environment.ENABLE_ESCROW_AUTOMATION = originalAutomationFlag;
    environment.NEXT_RUNTIME = originalNextRuntime;
    environment.NODE_ENV = originalNodeEnv;
    globalThis.__escrowAutomationStarted = undefined;
    globalThis.__escrowAutomationProcessedKeys = undefined;
    globalThis.__escrowAutomationRetryCounts = undefined;
    jest.restoreAllMocks();
  });

  it("does not start when automation is disabled", async () => {
    environment.ENABLE_ESCROW_AUTOMATION = undefined;

    const mockFindMonitorStateByChainId = jest.fn();
    const mockGetLatestEscrowBlockNumber = jest.fn();
    const mockListRefundCandidates = jest.fn();
    const mockListActiveEscrowMonitoringTargets = jest.fn();
    const mockReconcileActiveEscrows = jest.fn();
    const mockSyncAutomatedRefundEscrow = jest.fn();
    const mockUpsertMonitorState = jest.fn();

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(setInterval).not.toHaveBeenCalled();
    expect(mockListActiveEscrowMonitoringTargets).not.toHaveBeenCalled();
    expect(mockReconcileActiveEscrows).not.toHaveBeenCalled();
  });

  it("uses the stored cursor, deduplicates candidates, and persists the latest block", async () => {
    const mockFindMonitorStateByChainId = jest
      .fn()
      .mockResolvedValueOnce(createMonitorState(BigInt(100)));
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
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(setInterval).toHaveBeenCalledTimes(2);
    expect(mockFindMonitorStateByChainId).toHaveBeenCalledWith(1);
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
    expect(mockUpsertMonitorState).toHaveBeenCalledWith(1, BigInt(105));
    expect(globalThis.__escrowAutomationRetryCounts?.size ?? 0).toBe(0);
    expect(mockReconcileActiveEscrows).toHaveBeenCalledTimes(1);
  });

  it("seeds a missing cursor and skips log scanning on first run", async () => {
    const mockFindMonitorStateByChainId = jest.fn().mockResolvedValueOnce(null);
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(210));
    const mockListRefundCandidates = jest.fn();
    const mockListActiveEscrowMonitoringTargets = jest
      .fn()
      .mockResolvedValue([createTarget()]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest.fn();
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(mockUpsertMonitorState).toHaveBeenCalledWith(1, BigInt(210));
    expect(mockListRefundCandidates).not.toHaveBeenCalled();
    expect(mockSyncAutomatedRefundEscrow).not.toHaveBeenCalled();
  });

  it("retries failed candidates without advancing the cursor until they succeed", async () => {
    const mockFindMonitorStateByChainId = jest
      .fn()
      .mockResolvedValue(createMonitorState(BigInt(300)));
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(305));
    const failedTxHash = createTxHash("b");
    const successfulTxHash = createTxHash("c");
    const mockListRefundCandidates = jest.fn().mockResolvedValue([
      {
        contractAddress: "0x0000000000000000000000000000000000000010",
        txHash: failedTxHash,
      },
      {
        contractAddress: "0x0000000000000000000000000000000000000011",
        txHash: successfulTxHash,
      },
    ]);
    const mockListActiveEscrowMonitoringTargets = jest.fn().mockResolvedValue([
      createTarget(),
      createTarget({ contractAddress: "0x0000000000000000000000000000000000000011" }),
    ]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledTimes(2);
    expect(mockSyncAutomatedRefundEscrow).toHaveBeenNthCalledWith(
      1,
      1,
      "0x0000000000000000000000000000000000000010",
      failedTxHash
    );
    expect(mockSyncAutomatedRefundEscrow).toHaveBeenNthCalledWith(
      2,
      1,
      "0x0000000000000000000000000000000000000011",
      successfulTxHash
    );
    expect(mockUpsertMonitorState).not.toHaveBeenCalledWith(1, BigInt(305));
    expect(globalThis.__escrowAutomationProcessedKeys).toEqual(
      new Set([getProcessedKey(successfulTxHash, "0x0000000000000000000000000000000000000011")])
    );
    expect(globalThis.__escrowAutomationRetryCounts).toEqual(
      new Map([[getProcessedKey(failedTxHash, "0x0000000000000000000000000000000000000010"), 1]])
    );
    expect(console.error).toHaveBeenCalledWith(
      "[escrow-automation] Refund candidate sync failed; cursor will retry this range.",
      expect.objectContaining({
        chainId: 1,
        contractAddress: "0x0000000000000000000000000000000000000010",
        retryCount: 1,
        txHash: failedTxHash,
        errorMessage: "boom",
      })
    );

    getPollCallback()();
    await flushTasks();

    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledTimes(3);
    expect(mockSyncAutomatedRefundEscrow).toHaveBeenLastCalledWith(
      1,
      "0x0000000000000000000000000000000000000010",
      failedTxHash
    );
    expect(mockUpsertMonitorState).toHaveBeenCalledWith(1, BigInt(305));
    expect(globalThis.__escrowAutomationProcessedKeys).toEqual(
      new Set([
        getProcessedKey(failedTxHash, "0x0000000000000000000000000000000000000010"),
        getProcessedKey(successfulTxHash, "0x0000000000000000000000000000000000000011"),
      ])
    );
    expect(globalThis.__escrowAutomationRetryCounts?.size ?? 0).toBe(0);
  });

  it("skips a candidate after the second retry is exhausted and then advances the cursor", async () => {
    const mockFindMonitorStateByChainId = jest
      .fn()
      .mockResolvedValue(createMonitorState(BigInt(400)));
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(401));
    const txHash = createTxHash("d");
    const contractAddress = "0x0000000000000000000000000000000000000010";
    const mockListRefundCandidates = jest.fn().mockResolvedValue([
      {
        contractAddress,
        txHash,
      },
    ]);
    const mockListActiveEscrowMonitoringTargets = jest
      .fn()
      .mockResolvedValue([createTarget()]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest
      .fn()
      .mockRejectedValue(new Error("stuck"));
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(globalThis.__escrowAutomationRetryCounts).toEqual(
      new Map([[getProcessedKey(txHash, contractAddress), 1]])
    );
    expect(mockUpsertMonitorState).not.toHaveBeenCalledWith(1, BigInt(401));

    getPollCallback()();
    await flushTasks();

    expect(globalThis.__escrowAutomationRetryCounts).toEqual(
      new Map([[getProcessedKey(txHash, contractAddress), 2]])
    );
    expect(mockUpsertMonitorState).not.toHaveBeenCalledWith(1, BigInt(401));

    getPollCallback()();
    await flushTasks();

    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledTimes(3);
    expect(mockUpsertMonitorState).toHaveBeenCalledWith(1, BigInt(401));
    expect(globalThis.__escrowAutomationProcessedKeys).toEqual(
      new Set([getProcessedKey(txHash, contractAddress)])
    );
    expect(globalThis.__escrowAutomationRetryCounts?.size ?? 0).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      "[escrow-automation] Skipping refund candidate after retries exhausted.",
      expect.objectContaining({
        chainId: 1,
        contractAddress,
        retryCount: 3,
        txHash,
        errorMessage: "stuck",
      })
    );
  });

  it("clears the processed-key cache and retry counts when the cache reaches the max size", async () => {
    const existingKeys = Array.from({ length: 1000 }, (_, index) => `key-${index}`);

    globalThis.__escrowAutomationProcessedKeys = new Set(existingKeys);
    globalThis.__escrowAutomationRetryCounts = new Map([["stale", 2]]);

    const mockFindMonitorStateByChainId = jest
      .fn()
      .mockResolvedValueOnce(createMonitorState(BigInt(400)));
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(401));
    const txHash = createTxHash("d");
    const mockListRefundCandidates = jest.fn().mockResolvedValue([
      {
        contractAddress: "0x0000000000000000000000000000000000000010",
        txHash,
      },
    ]);
    const mockListActiveEscrowMonitoringTargets = jest
      .fn()
      .mockResolvedValue([createTarget()]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest.fn().mockResolvedValue(true);
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();

    expect(mockSyncAutomatedRefundEscrow).toHaveBeenCalledTimes(1);
    expect(globalThis.__escrowAutomationProcessedKeys).toEqual(
      new Set([getProcessedKey(txHash, "0x0000000000000000000000000000000000000010")])
    );
    expect(globalThis.__escrowAutomationRetryCounts?.size ?? 0).toBe(0);
  });

  it("does not schedule polling twice when already started", async () => {
    const mockFindMonitorStateByChainId = jest
      .fn()
      .mockResolvedValue(createMonitorState(BigInt(100)));
    const mockGetLatestEscrowBlockNumber = jest.fn().mockResolvedValue(BigInt(101));
    const mockListRefundCandidates = jest.fn().mockResolvedValue([]);
    const mockListActiveEscrowMonitoringTargets = jest
      .fn()
      .mockResolvedValue([createTarget()]);
    const mockReconcileActiveEscrows = jest.fn().mockResolvedValue(0);
    const mockSyncAutomatedRefundEscrow = jest.fn().mockResolvedValue(true);
    const mockUpsertMonitorState = jest.fn().mockResolvedValue(undefined);

    mockAutomationMonitorDependencies({
      findMonitorStateByChainId: mockFindMonitorStateByChainId,
      getLatestEscrowBlockNumber: mockGetLatestEscrowBlockNumber,
      listActiveEscrowMonitoringTargets: mockListActiveEscrowMonitoringTargets,
      listRefundCandidates: mockListRefundCandidates,
      reconcileActiveEscrows: mockReconcileActiveEscrows,
      syncAutomatedRefundEscrow: mockSyncAutomatedRefundEscrow,
      upsertMonitorState: mockUpsertMonitorState,
    });

    await startMonitor();
    await startMonitor();

    expect(setInterval).toHaveBeenCalledTimes(2);
    expect(mockListActiveEscrowMonitoringTargets).toHaveBeenCalledTimes(1);
    expect(mockReconcileActiveEscrows).toHaveBeenCalledTimes(1);
  });
});
