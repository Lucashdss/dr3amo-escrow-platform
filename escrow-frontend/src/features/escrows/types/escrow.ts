export const ESCROW_CHAIN_KEYS = ["base", "baseSepolia"] as const;
export const TOKEN_SYMBOLS = ["ETH", "USDC"] as const;
export const ESCROW_ACTION_KEYS = [
  "cancelEscrow",
  "fund",
  "confirmDelivery",
  "requestModificationAndUpdateDeadline",
  "initiateDispute",
  "setMinimumPriceUSD",
  "markWorkSubmitted",
] as const;
export const ESCROW_LIVE_STATES = [
  "created",
  "funded",
  "work submitted",
  "pending modification",
  "released",
  "refunded",
  "dispute",
  "canceled",
] as const;

export type EscrowChainKey = (typeof ESCROW_CHAIN_KEYS)[number];
export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];
export type EscrowActionKey = (typeof ESCROW_ACTION_KEYS)[number];
export type EscrowLiveState = (typeof ESCROW_LIVE_STATES)[number];

export type EscrowRecord = {
  id: number;
  contract_address: string;
  escrow_name: string;
  client_id: number;
  freelancer_id: number;
  token_id: number;
  chain_id: number;
  amount: string;
  modifications_requested?: number;
  deadline: string;
  state: string;
  created_at: string;
  changed_at?: string | null;
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

export const ESCROW_MANAGEMENT_ROLES = ["client", "freelancer"] as const;

export type EscrowManagementRole = (typeof ESCROW_MANAGEMENT_ROLES)[number];

export type EscrowManagementItem = {
  id: number;
  amount: string;
  chainId: number;
  changedAt?: string | null;
  clientUsername: string;
  contractAddress: string;
  createdAt: string;
  deadline: string;
  escrowName: string;
  freelancerUsername: string;
  modificationsRequested?: number;
  role: EscrowManagementRole;
  state: string;
  tokenAddress: string;
  tokenId: number;
};

export type EscrowManagementListResult = {
  escrows: EscrowManagementItem[];
};

export type EscrowManagementDetailResult = {
  escrow: EscrowManagementItem | null;
};

export type EscrowLiveSnapshot = {
  minimumPriceUsd: string | null;
  modificationsRequested: number | null;
};

export type EscrowActionAvailability = {
  description: string;
  disabled: boolean;
  disabledReason: string | null;
  inputKind: "none" | "amount" | "days" | "usd";
  key: EscrowActionKey;
  label: string;
};

export type SyncEscrowActionRequest = {
  action: EscrowActionKey;
  txHash: string;
  userId: number;
};

export type SyncEscrowActionResult = {
  escrow: EscrowManagementItem | null;
  txHash: string;
};

export type ClientEscrowSummaryResult = {
  activeContractsCount: number;
  deadlinesApproachingCount: number;
  completedContractsCount: number;
  ethAmount: string;
  pendingReviewsCount: number;
  totalAmount: string;
  usdcAmount: string;
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
  ethAmount: string;
  totalAmount: string;
  usdcAmount: string;
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
