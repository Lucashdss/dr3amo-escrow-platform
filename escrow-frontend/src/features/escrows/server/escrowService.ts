import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";
import { findUserByWalletAddress } from "@/features/auth/server/userRepository";
import type {
  CreateEscrowRequest,
  CreateEscrowResult,
  EscrowChainKey,
  EscrowListResult,
  TokenSymbol,
} from "@/features/escrows/types/escrow";

import * as repository from "./escrowRepository";

type EscrowRepository = {
  createEscrowRecord: typeof repository.createEscrowRecord;
  findEscrowById: typeof repository.findEscrowById;
  listEscrows: typeof repository.listEscrows;
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
    freelancerId: freelancerUser.id,
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
