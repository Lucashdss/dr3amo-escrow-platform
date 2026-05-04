import * as repository from "@/features/escrows/server/escrowRepository";
import {
  readCurrentEscrowSnapshot,
  verifyRefundTransaction,
} from "@/features/escrows/server/escrowAutomationChain";
import {
  canReachEscrowState,
  normalizeEscrowDatabaseState,
} from "@/features/escrows/services/escrowShared";
import {
  ACTIVE_ESCROW_MONITOR_STATES,
  type EscrowPersistedSnapshot,
} from "@/features/escrows/types/escrow";

type EscrowRepository = Pick<
  typeof repository,
  | "findEscrowByContractAddressAndChainId"
  | "listActiveEscrowMonitoringTargets"
  | "updateEscrowSnapshot"
>;

const defaultRepository: EscrowRepository = repository;
const ACTIVE_MONITOR_STATES: typeof ACTIVE_ESCROW_MONITOR_STATES = [
  "funded",
  "work submitted",
  "pending modification",
];

export async function listActiveEscrowMonitoringTargets(
  repo: EscrowRepository = defaultRepository
) {
  const targets = await repo.listActiveEscrowMonitoringTargets(ACTIVE_MONITOR_STATES);

  return targets;
}

export async function syncAutomatedRefundEscrow(
  chainId: number,
  contractAddress: string,
  txHash: string,
  repo: EscrowRepository = defaultRepository
): Promise<boolean> {
  const escrow = await repo.findEscrowByContractAddressAndChainId(
    contractAddress,
    chainId
  );
  let synced = false;

  if (escrow && canMonitorEscrowState(escrow.state)) {
    const snapshot = await verifyRefundTransaction(
      chainId,
      contractAddress,
      escrow.tokenId,
      txHash
    );

    if (canPersistReconciledState(escrow.state, snapshot.state)) {
      await repo.updateEscrowSnapshot(
        createChainSnapshotUpdate(escrow.id, snapshot, txHash)
      );
      synced = true;
    }
  }

  return synced;
}

export async function reconcileActiveEscrows(
  repo: EscrowRepository = defaultRepository
): Promise<number> {
  const escrows = await repo.listActiveEscrowMonitoringTargets(ACTIVE_MONITOR_STATES);
  let updatedCount = 0;

  for (const escrow of escrows) {
    const snapshot = await readCurrentEscrowSnapshot({
      chainId: escrow.chainId,
      contractAddress: escrow.contractAddress,
      tokenId: escrow.tokenId,
    });

    if (canUpdateEscrowSnapshot(escrow, snapshot)) {
      await repo.updateEscrowSnapshot(createChainSnapshotUpdate(escrow.id, snapshot));
      updatedCount += 1;
    }
  }

  return updatedCount;
}

function canMonitorEscrowState(state: string): boolean {
  const canMonitor = ACTIVE_MONITOR_STATES.includes(
    state.toLowerCase() as (typeof ACTIVE_MONITOR_STATES)[number]
  );

  return canMonitor;
}

function canUpdateEscrowSnapshot(
  escrow: Awaited<ReturnType<typeof repository.listActiveEscrowMonitoringTargets>>[number],
  snapshot: EscrowPersistedSnapshot
): boolean {
  const isChanged = hasSnapshotChanged(escrow, snapshot);
  const canPersist = canPersistReconciledState(escrow.state, snapshot.state);

  return isChanged && canPersist;
}

function hasSnapshotChanged(
  escrow: Awaited<ReturnType<typeof repository.listActiveEscrowMonitoringTargets>>[number],
  snapshot: EscrowPersistedSnapshot
): boolean {
  const hasChanged =
    snapshot.amount !== escrow.amount ||
    snapshot.deadline !== escrow.deadline ||
    snapshot.modificationsRequested !== escrow.modificationsRequested ||
    normalizeEscrowDatabaseState(snapshot.state) !==
      normalizeEscrowDatabaseState(escrow.state);

  return hasChanged;
}

function createChainSnapshotUpdate(
  id: number,
  snapshot: EscrowPersistedSnapshot,
  lastTxHash?: string
) {
  return {
    amount: snapshot.amount,
    deadline: snapshot.deadline,
    id,
    lastTxHash,
    modificationsRequested: snapshot.modificationsRequested,
    state: normalizeEscrowDatabaseState(snapshot.state),
  };
}

function canPersistReconciledState(currentState: string, nextState: string): boolean {
  const canPersist = canReachEscrowState(currentState, nextState);

  return canPersist;
}
