export const ESCROW_CHAIN_KEYS = ["base", "baseSepolia"] as const;
export const TOKEN_SYMBOLS = ["ETH", "USDC"] as const;

export type EscrowChainKey = (typeof ESCROW_CHAIN_KEYS)[number];
export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export type EscrowRecord = {
  id: number;
  contract_address: string;
  escrow_name: string;
  client_id: number;
  freelancer_id: number;
  token_id: number;
  chain_id: number;
  amount: string;
  deadline: string;
  state: string;
  created_at: string;
};

export type CreateEscrowRequest = {
  chainKey: EscrowChainKey;
  contractAddress: string;
  escrowName: string;
  clientWalletAddress: string;
  freelancerWalletAddress: string;
  tokenSymbol: TokenSymbol;
  deadline: string;
  amount: string;
  state: string;
  txHash: string;
};

export type CreateEscrowResult = {
  message: string;
  escrow: EscrowRecord | null;
  txHash: string;
};

export type EscrowListResult = {
  escrows: EscrowRecord[];
};

export const ESCROW_MANAGEMENT_ROLES = [
  "client",
  "freelancer",
  "client_and_freelancer",
] as const;

export type EscrowManagementRole = (typeof ESCROW_MANAGEMENT_ROLES)[number];

export type EscrowManagementItem = {
  id: number;
  amount: string;
  chainId: number;
  clientUsername: string;
  contractAddress: string;
  createdAt: string;
  deadline: string;
  escrowName: string;
  freelancerUsername: string;
  role: EscrowManagementRole;
  state: string;
  tokenId: number;
};

export type EscrowManagementListResult = {
  escrows: EscrowManagementItem[];
};

export type EscrowManagementDetailResult = {
  escrow: EscrowManagementItem | null;
};

export type ClientEscrowSummaryResult = {
  activeContractsCount: number;
  deadlinesApproachingCount: number;
  completedContractsCount: number;
  pendingReviewsCount: number;
  totalAmount: string;
};

export type ClientEscrowStateGroups = {
  activeExcluded: readonly string[];
  completed: readonly string[];
  pendingReview: readonly string[];
};

export type FreelancerEscrowSummaryResult = {
  activeContractsCount: number;
  completedContractsCount: number;
  deadlinesApproachingCount: number;
  totalAmount: string;
  waitingDeliveriesCount: number;
};

export type FreelancerEscrowStateGroups = {
  completed: readonly string[];
  deadlinesExcluded: readonly string[];
  receivableExcluded: readonly string[];
  waitingDeliveryExcluded: readonly string[];
};

export type EscrowSummary = {
  id: string;
  client: string;
  freelancer: string;
  amount: string;
  released: boolean;
};
