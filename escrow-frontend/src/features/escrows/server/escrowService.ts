import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";
import {
  decodeEscrowReceiptEventNames,
  getFundReceiptUpdate,
  getModificationReceiptUpdate,
  getEscrowSyncReceipt,
  readEscrowSyncSnapshot,
} from "@/features/escrows/services/escrowContract";
import { findUserByWalletAddress } from "@/features/auth/server/userRepository";
import type {
  ClientEscrowStateGroups,
  ClientEscrowSummaryResult,
  CreateEscrowRequest,
  CreateEscrowResult,
  EscrowChainKey,
  EscrowActionKey,
  EscrowManagementDetailResult,
  EscrowManagementListResult,
  EscrowListResult,
  FreelancerEscrowStateGroups,
  FreelancerEscrowSummaryResult,
  SyncEscrowActionResult,
  TokenSymbol,
} from "@/features/escrows/types/escrow";

import * as repository from "./escrowRepository";

type EscrowRepository = {
  createEscrowRecord: typeof repository.createEscrowRecord;
  findEscrowManagementByIdForUser: typeof repository.findEscrowManagementByIdForUser;
  findEscrowById: typeof repository.findEscrowById;
  getClientEscrowSummary: typeof repository.getClientEscrowSummary;
  getFreelancerEscrowSummary: typeof repository.getFreelancerEscrowSummary;
  listEscrows: typeof repository.listEscrows;
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
  activeExcluded: ["cancelled", "released", "refunded"],
  completed: ["cancelled", "released", "refunded"],
  pendingReview: ["work submitted"],
};
const FREELANCER_ESCROW_STATE_GROUPS: FreelancerEscrowStateGroups = {
  completed: ["released"],
  deadlinesExcluded: ["work submitted", "cancelled", "released", "refunded"],
  receivableExcluded: ["cancelled", "released", "refunded"],
  waitingDeliveryExcluded: ["work submitted"],
};

function getDirectActionSnapshot(
  action: EscrowActionKey,
  escrow: {
    amount: string;
    deadline: string;
    modificationsRequested?: number;
  }
): {
  amount: string;
  deadline: string;
  modificationsRequested: number;
  state: string;
} | null {
  if (action === "markWorkSubmitted") {
    return {
      amount: escrow.amount,
      deadline: escrow.deadline,
      modificationsRequested: escrow.modificationsRequested ?? 0,
      state: "work submitted",
    };
  }

  if (action === "initiateDispute") {
    return {
      amount: escrow.amount,
      deadline: escrow.deadline,
      modificationsRequested: escrow.modificationsRequested ?? 0,
      state: "dispute",
    };
  }

  if (action === "confirmDelivery") {
    return {
      amount: escrow.amount,
      deadline: escrow.deadline,
      modificationsRequested: escrow.modificationsRequested ?? 0,
      state: "released",
    };
  }

  return null;
}

function isDirectSyncAction(action: EscrowActionKey): boolean {
  return (
    action === "fund" ||
    action === "markWorkSubmitted" ||
    action === "initiateDispute" ||
    action === "confirmDelivery" ||
    action === "requestModificationAndUpdateDeadline"
  );
}

function getTokenId(chainKey: EscrowChainKey, tokenSymbol: TokenSymbol): number {
  return TOKEN_IDS[chainKey][tokenSymbol];
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

export async function listEscrows(
  repo: EscrowRepository = defaultRepository
): Promise<EscrowListResult> {
  return { escrows: await repo.listEscrows() };
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
  userId: number,
  txHash: string,
  action: EscrowActionKey,
  repo: EscrowRepository = defaultRepository
): Promise<SyncEscrowActionResult> {
  const escrow = await repo.findEscrowManagementByIdForUser(id, userId);

  if (!escrow) {
    throw new AppError("Escrow not found.", 404);
  }

  const receipt = await getEscrowSyncReceipt(escrow.chainId, txHash);

  if (receipt.status !== "success") {
    throw new AppError("The escrow transaction was not successful.", 400);
  }

  const decodedEventNames = decodeEscrowReceiptEventNames(receipt.logs);
  const directActionSnapshot = getDirectActionSnapshot(action, escrow);

  if (!decodedEventNames.length && !isDirectSyncAction(action)) {
    throw new AppError("Failed to decode a relevant escrow event.", 400);
  }

  let snapshot: {
    amount: string;
    deadline: string;
    modificationsRequested: number;
    state: string;
  };

  if (action === "fund") {
    snapshot = await getFundReceiptUpdate(escrow, txHash, receipt.logs);
  } else if (action === "requestModificationAndUpdateDeadline") {
    const modificationSnapshot = await getModificationReceiptUpdate(escrow, txHash);
    snapshot = {
      amount: escrow.amount,
      deadline: modificationSnapshot.deadline,
      modificationsRequested: (escrow.modificationsRequested ?? 0) + 1,
      state: modificationSnapshot.state,
    };
  } else {
    snapshot = directActionSnapshot ?? (await readEscrowSyncSnapshot(escrow));
  }

  await repo.updateEscrowSnapshot({
    amount: snapshot.amount,
    deadline: snapshot.deadline,
    id,
    modificationsRequested: snapshot.modificationsRequested,
    state: snapshot.state,
  });

  return {
    escrow: await repo.findEscrowManagementByIdForUser(id, userId),
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
  repo: EscrowRepository = defaultRepository,
  lookupUser: UserLookup = findUserByWalletAddress
): Promise<CreateEscrowResult> {
  const clientUser = await requireUser(
    request.clientWalletAddress,
    "Client wallet is not registered.",
    lookupUser
  );
  const freelancerUser = await requireUser(
    request.freelancerWalletAddress,
    "Freelancer wallet is not registered.",
    lookupUser
  );
  const insertId = await repo.createEscrowRecord({
    amount: request.amount,
    chainId: CHAIN_IDS[request.chainKey],
    clientId: clientUser.id,
    contractAddress: request.contractAddress,
    deadline: request.deadline,
    escrowName: request.escrowName,
    freelancerId: freelancerUser.id,
    modificationsRequested: 0,
    state: request.state,
    tokenId: getTokenId(request.chainKey, request.tokenSymbol),
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
