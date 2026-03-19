export const ESCROW_CHAIN_KEYS = ["base", "baseSepolia"] as const;
export const TOKEN_SYMBOLS = ["ETH", "USDC"] as const;

export type EscrowChainKey = (typeof ESCROW_CHAIN_KEYS)[number];
export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export type EscrowRecord = {
  id: number;
  contract_address: string;
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

export type EscrowSummary = {
  id: string;
  client: string;
  freelancer: string;
  amount: string;
  released: boolean;
};
