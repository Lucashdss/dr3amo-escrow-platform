import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";
import {
  canReachEscrowState,
  isAutomationMonitoringState,
  normalizeEscrowDatabaseState,
  readCurrentEscrowSnapshot,
  verifyCreateEscrowTransaction,
  verifyEscrowActionTransaction,
  verifyRefundTransaction,
} from "@/features/escrows/services/escrowContract";
import { findUserByWalletAddress } from "@/features/auth/server/userRepository";
import { ACTIVE_ESCROW_MONITOR_STATES } from "@/features/escrows/types/escrow";
import type {
  ClientEscrowStateGroups,
  ClientEscrowSummaryResult,
  CreateEscrowRequest,
  CreateEscrowResult,
  EscrowChainKey,
  EscrowActionKey,
  EscrowManagementDetailResult,
  EscrowManagementListResult,
  EscrowPersistedSnapshot,
  FreelancerEscrowStateGroups,
  FreelancerEscrowSummaryResult,
  SyncEscrowActionResult,
  TokenSymbol,
} from "@/features/escrows/types/escrow";

import * as repository from "./escrowRepository";

type EscrowRepository = {
  createEscrowRecord: typeof repository.createEscrowRecord;
  findEscrowByContractAddressAndChainId:
    typeof repository.findEscrowByContractAddressAndChainId;
  findEscrowManagementByIdForUser: typeof repository.findEscrowManagementByIdForUser;
  findEscrowById: typeof repository.findEscrowById;
  getClientEscrowSummary: typeof repository.getClientEscrowSummary;
  getFreelancerEscrowSummary: typeof repository.getFreelancerEscrowSummary;
  listActiveEscrowMonitoringTargets: typeof repository.listActiveEscrowMonitoringTargets;
  listEscrowsForUser: typeof repository.listEscrowsForUser;
  updateEscrowSnapshot: typeof repository.updateEscrowSnapshot;
};

type UserLookup = (walletAddress: string) => Promise<UserRecord | null>;

const defaultRepository: EscrowRepository = repository;

const CHAIN_IDS: Record<EscrowChainKey, number> = {
  base: 1,
  baseSepolia: 2,
};

const TOKEN_IDS: Record<EscrowChainKey, Record<TokenSymbol, number>> = {
  base: {
    ETH: 3,
    USDC: 1,
  },
  baseSepolia: {
    ETH: 3,
    USDC: 2,
  },
};

const CLIENT_ESCROW_STATE_GROUPS: ClientEscrowStateGroups = {
  activeExcluded: ["canceled", "released", "refunded"],
  completed: ["canceled", "released", "refunded"],
  pendingReview: ["work submitted"],
};
const FREELANCER_ESCROW_STATE_GROUPS: FreelancerEscrowStateGroups = {
  completed: ["released"],
  deadlinesExcluded: ["work submitted", "canceled", "released", "refunded"],
  receivableExcluded: ["canceled", "released", "refunded"],
  waitingDeliveryExcluded: ["work submitted"],
};
const ACTIVE_MONITOR_STATES: typeof ACTIVE_ESCROW_MONITOR_STATES = [
  "funded",
  "work submitted",
  "pending modification",
];

function getTokenId(chainKey: EscrowChainKey, tokenSymbol: TokenSymbol): number {
  return TOKEN_IDS[chainKey][tokenSymbol];
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
  return canReachEscrowState(currentState, nextState);
}

async function requireUser(
  walletAddress: string,
  message: string,
  lookupUser: UserLookup
): Promise<UserRecord> {
  const user = await lookupUser(walletAddress);

  if (!user) {
    throw new AppError(message, 400);
  }

  return user;
}

export async function listEscrowsForUser(
  userId: number,
  repo: EscrowRepository = defaultRepository
): Promise<EscrowManagementListResult> {
  return { escrows: await repo.listEscrowsForUser(userId) };
}

export async function getEscrowManagementDetail(
  id: number,
  userId: number,
  repo: EscrowRepository = defaultRepository
): Promise<EscrowManagementDetailResult> {
  const escrow = await repo.findEscrowManagementByIdForUser(id, userId);

  if (!escrow) {
    throw new AppError("Escrow not found.", 404);
  }

  return { escrow };
}

export async function syncEscrowAction(
  id: number,
  user: Pick<UserRecord, "id" | "wallet_address">,
  txHash: string,
  action: EscrowActionKey,
  repo: EscrowRepository = defaultRepository
): Promise<SyncEscrowActionResult> {
  const escrow = await repo.findEscrowManagementByIdForUser(id, user.id);

  if (!escrow) {
    throw new AppError("Escrow not found.", 404);
  }

  const snapshot = await verifyEscrowActionTransaction({
    action,
    authenticatedWalletAddress: user.wallet_address,
    escrow,
    txHash,
  });

  await repo.updateEscrowSnapshot(createChainSnapshotUpdate(id, snapshot, txHash));

  return {
    escrow: await repo.findEscrowManagementByIdForUser(id, user.id),
    txHash,
  };
}

export async function getClientEscrowSummary(
  clientId: number,
  repo: EscrowRepository = defaultRepository
): Promise<ClientEscrowSummaryResult> {
  return repo.getClientEscrowSummary(clientId, CLIENT_ESCROW_STATE_GROUPS);
}

export async function getFreelancerEscrowSummary(
  freelancerId: number,
  repo: EscrowRepository = defaultRepository
): Promise<FreelancerEscrowSummaryResult> {
  return repo.getFreelancerEscrowSummary(
    freelancerId,
    FREELANCER_ESCROW_STATE_GROUPS
  );
}

export async function createEscrow(
  request: CreateEscrowRequest,
  clientWalletAddress: string,
  repo: EscrowRepository = defaultRepository,
  lookupUser: UserLookup = findUserByWalletAddress
): Promise<CreateEscrowResult> {
  const tokenId = getTokenId(request.chainKey, request.tokenSymbol);
  const clientUser = await requireUser(
    clientWalletAddress,
    "Client wallet is not registered.",
    lookupUser
  );
  const freelancerUser = await requireUser(
    request.freelancerWalletAddress,
    "Freelancer wallet is not registered.",
    lookupUser
  );
  const verification = await verifyCreateEscrowTransaction({
    authenticatedWalletAddress: clientWalletAddress,
    chainKey: request.chainKey,
    databaseChainId: CHAIN_IDS[request.chainKey],
    deadline: request.deadline,
    freelancerWalletAddress: request.freelancerWalletAddress,
    tokenId,
    tokenSymbol: request.tokenSymbol,
    txHash: request.txHash,
  });
  const insertId = await repo.createEscrowRecord({
    amount: verification.snapshot.amount,
    chainId: CHAIN_IDS[request.chainKey],
    clientId: clientUser.id,
    contractAddress: verification.contractAddress,
    createdTxHash: request.txHash,
    deadline: verification.snapshot.deadline,
    escrowName: request.escrowName,
    freelancerId: freelancerUser.id,
    lastTxHash: request.txHash,
    modificationsRequested: verification.snapshot.modificationsRequested,
    state: verification.snapshot.state,
    tokenId,
  });
  const escrow = await repo.findEscrowById(insertId);

  if (!escrow) {
    throw new AppError("Failed to load created escrow.", 500);
  }

  return {
    message: "Escrow persisted successfully.",
    escrow,
    txHash: request.txHash,
  };
}

export async function listActiveEscrowMonitoringTargets(
  repo: EscrowRepository = defaultRepository
) {
  return repo.listActiveEscrowMonitoringTargets(ACTIVE_MONITOR_STATES);
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

  if (!escrow || !isAutomationMonitoringState(escrow.state)) {
    return false;
  }

  const snapshot = await verifyRefundTransaction(
    chainId,
    contractAddress,
    escrow.tokenId,
    txHash
  );

  if (!canPersistReconciledState(escrow.state, snapshot.state)) {
    return false;
  }

  await repo.updateEscrowSnapshot(
    createChainSnapshotUpdate(escrow.id, snapshot, txHash)
  );

  return true;
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
    const isChanged =
      snapshot.amount !== escrow.amount ||
      snapshot.deadline !== escrow.deadline ||
      snapshot.modificationsRequested !== escrow.modificationsRequested ||
      normalizeEscrowDatabaseState(snapshot.state) !==
        normalizeEscrowDatabaseState(escrow.state);

    if (isChanged && canPersistReconciledState(escrow.state, snapshot.state)) {
      await repo.updateEscrowSnapshot(createChainSnapshotUpdate(escrow.id, snapshot));
      updatedCount += 1;
    }
  }

  return updatedCount;
}
