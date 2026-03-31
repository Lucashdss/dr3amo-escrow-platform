const mockIsAutomationMonitoringState = jest.fn();
const mockCanReachEscrowState = jest.fn();
const mockNormalizeEscrowDatabaseState = jest.fn();
const mockReadCurrentEscrowSnapshot = jest.fn();
const mockVerifyCreateEscrowTransaction = jest.fn();
const mockVerifyEscrowActionTransaction = jest.fn();
const mockVerifyRefundTransaction = jest.fn();

jest.mock("@/features/escrows/services/escrowContract", () => ({
  canReachEscrowState: (...args: unknown[]) => mockCanReachEscrowState(...args),
  isAutomationMonitoringState: (...args: unknown[]) =>
    mockIsAutomationMonitoringState(...args),
  normalizeEscrowDatabaseState: (...args: unknown[]) =>
    mockNormalizeEscrowDatabaseState(...args),
  readCurrentEscrowSnapshot: (...args: unknown[]) =>
    mockReadCurrentEscrowSnapshot(...args),
  verifyCreateEscrowTransaction: (...args: unknown[]) =>
    mockVerifyCreateEscrowTransaction(...args),
  verifyEscrowActionTransaction: (...args: unknown[]) =>
    mockVerifyEscrowActionTransaction(...args),
  verifyRefundTransaction: (...args: unknown[]) =>
    mockVerifyRefundTransaction(...args),
}));

import {
  listActiveEscrowMonitoringTargets,
  reconcileActiveEscrows,
  syncAutomatedRefundEscrow,
} from "@/features/escrows/server/escrowService";

function createRepository() {
  return {
    createEscrowRecord: jest.fn(),
    findEscrowByContractAddressAndChainId: jest.fn(),
    findEscrowById: jest.fn(),
    findEscrowManagementByIdForUser: jest.fn(),
    getClientEscrowSummary: jest.fn(),
    getFreelancerEscrowSummary: jest.fn(),
    listActiveEscrowMonitoringTargets: jest.fn(),
    listEscrows: jest.fn(),
    listEscrowsForUser: jest.fn(),
    updateEscrowSnapshot: jest.fn(),
  };
}

function createMonitoringEscrow(overrides: Record<string, unknown> = {}) {
  return {
    amount: "1.0",
    chainId: 1,
    contractAddress: "0x0000000000000000000000000000000000000010",
    deadline: "2026-03-20",
    id: 7,
    lastTxHash: `0x${"1".repeat(64)}`,
    modificationsRequested: 0,
    state: "funded",
    tokenId: 1,
    ...overrides,
  };
}

describe("escrowService automation flows", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockCanReachEscrowState.mockReturnValue(true);
    mockNormalizeEscrowDatabaseState.mockImplementation(
      (state: string) => state.trim().toLowerCase()
    );
  });

  it("lists monitoring targets only for active automation states", async () => {
    const repository = createRepository();
    const targets = [createMonitoringEscrow()];

    repository.listActiveEscrowMonitoringTargets.mockResolvedValueOnce(targets);

    const result = await listActiveEscrowMonitoringTargets(repository);

    expect(repository.listActiveEscrowMonitoringTargets).toHaveBeenCalledWith([
      "funded",
      "work submitted",
      "pending modification",
    ]);
    expect(result).toEqual(targets);
  });

  it("ignores automated refund sync for non-monitored states", async () => {
    const repository = createRepository();

    repository.findEscrowByContractAddressAndChainId.mockResolvedValueOnce(
      createMonitoringEscrow({ state: "created" })
    );
    mockIsAutomationMonitoringState.mockReturnValueOnce(false);

    const result = await syncAutomatedRefundEscrow(
      1,
      "0x0000000000000000000000000000000000000010",
      `0x${"2".repeat(64)}`,
      repository
    );

    expect(result).toBe(false);
    expect(mockVerifyRefundTransaction).not.toHaveBeenCalled();
    expect(repository.updateEscrowSnapshot).not.toHaveBeenCalled();
  });

  it("persists a verified automated refund snapshot and advances last tx hash", async () => {
    const repository = createRepository();
    const txHash = `0x${"3".repeat(64)}`;

    repository.findEscrowByContractAddressAndChainId.mockResolvedValueOnce(
      createMonitoringEscrow({ state: "funded", tokenId: 2 })
    );
    mockIsAutomationMonitoringState.mockReturnValueOnce(true);
    mockVerifyRefundTransaction.mockResolvedValueOnce({
      amount: "0",
      deadline: "2026-03-20",
      modificationsRequested: 0,
      state: "refunded",
    });

    const result = await syncAutomatedRefundEscrow(
      2,
      "0x0000000000000000000000000000000000000010",
      txHash,
      repository
    );

    expect(result).toBe(true);
    expect(mockVerifyRefundTransaction).toHaveBeenCalledWith(
      2,
      "0x0000000000000000000000000000000000000010",
      2,
      txHash
    );
    expect(repository.updateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "0",
      deadline: "2026-03-20",
      id: 7,
      lastTxHash: txHash,
      modificationsRequested: 0,
      state: "refunded",
    });
  });

  it("reconciles only escrows whose on-chain snapshot differs from the database", async () => {
    const repository = createRepository();
    const unchangedEscrow = createMonitoringEscrow({
      contractAddress: "0x0000000000000000000000000000000000000011",
      id: 8,
      lastTxHash: `0x${"4".repeat(64)}`,
      state: "work submitted",
    });
    const changedEscrow = createMonitoringEscrow({
      contractAddress: "0x0000000000000000000000000000000000000012",
      id: 9,
      lastTxHash: `0x${"5".repeat(64)}`,
      modificationsRequested: 1,
      state: "pending modification",
    });

    repository.listActiveEscrowMonitoringTargets.mockResolvedValueOnce([
      unchangedEscrow,
      changedEscrow,
    ]);
    mockReadCurrentEscrowSnapshot
      .mockResolvedValueOnce({
        amount: "1.0",
        deadline: "2026-03-20",
        modificationsRequested: 0,
        state: "work submitted",
      })
      .mockResolvedValueOnce({
        amount: "1.0",
        deadline: "2026-03-24",
        modificationsRequested: 2,
        state: "pending modification",
      });

    const result = await reconcileActiveEscrows(repository);

    expect(repository.listActiveEscrowMonitoringTargets).toHaveBeenCalledWith([
      "funded",
      "work submitted",
      "pending modification",
    ]);
    expect(mockReadCurrentEscrowSnapshot).toHaveBeenNthCalledWith(1, {
      chainId: 1,
      contractAddress: "0x0000000000000000000000000000000000000011",
      tokenId: 1,
    });
    expect(mockReadCurrentEscrowSnapshot).toHaveBeenNthCalledWith(2, {
      chainId: 1,
      contractAddress: "0x0000000000000000000000000000000000000012",
      tokenId: 1,
    });
    expect(repository.updateEscrowSnapshot).toHaveBeenCalledTimes(1);
    expect(repository.updateEscrowSnapshot).toHaveBeenCalledWith({
      amount: "1.0",
      deadline: "2026-03-24",
      id: 9,
      lastTxHash: undefined,
      modificationsRequested: 2,
      state: "pending modification",
    });
    expect(result).toBe(1);
  });

  it("does not persist backward reconciliation state changes", async () => {
    const repository = createRepository();
    const escrow = createMonitoringEscrow({
      state: "work submitted",
    });

    repository.listActiveEscrowMonitoringTargets.mockResolvedValueOnce([escrow]);
    mockCanReachEscrowState.mockReturnValueOnce(false);
    mockReadCurrentEscrowSnapshot.mockResolvedValueOnce({
      amount: "1.0",
      deadline: "2026-03-20",
      modificationsRequested: 0,
      state: "funded",
    });

    const result = await reconcileActiveEscrows(repository);

    expect(repository.updateEscrowSnapshot).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});
