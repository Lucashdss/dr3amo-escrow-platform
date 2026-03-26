import type {
  EscrowManagementItem,
  EscrowManagementRole,
} from "@/features/escrows/types/escrow";

const ESCROW_CHAIN_LABELS: Record<number, string> = {
  1: "Base",
  2: "Base Sepolia",
};

const ESCROW_TOKEN_LABELS: Record<number, string> = {
  1: "USDC",
  2: "USDC",
  3: "ETH",
};

export function formatEscrowDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function formatEscrowDateTime(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function formatEscrowRole(role: EscrowManagementRole): string {
  return role === "client" ? "Buyer" : "Seller";
}

export function formatEscrowState(state: string): string {
  return state
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

export function getEscrowChainLabel(chainId: number): string {
  return ESCROW_CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
}

export function getEscrowTokenLabel(tokenId: number): string {
  return ESCROW_TOKEN_LABELS[tokenId] ?? `Token ${tokenId}`;
}

export function getCounterpartyLabel(escrow: EscrowManagementItem): string {
  if (escrow.role === "client") {
    return escrow.freelancerUsername;
  }

  return escrow.clientUsername;
}

export function getCounterpartyTitle(role: EscrowManagementRole): string {
  if (role === "client") {
    return "Seller";
  }

  return "Buyer";
}

export function trimContractAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
