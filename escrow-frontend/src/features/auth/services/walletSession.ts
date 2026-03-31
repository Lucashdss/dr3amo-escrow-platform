import { normalizeWalletAddress } from "@/lib/normalizers";

export function hasSessionMismatch(
  address: string | undefined,
  walletAddress: string | null
): boolean {
  const hasAddresses = Boolean(address && walletAddress);
  const connectedAddress = address ?? "";
  let isMismatch = false;

  if (hasAddresses) {
    isMismatch = normalizeWalletAddress(connectedAddress) !== walletAddress;
  }

  return isMismatch;
}

export function hasSessionForWallet(
  address: string | undefined,
  walletAddress: string | null
): boolean {
  const hasAddresses = Boolean(address && walletAddress);
  const connectedAddress = address ?? "";
  let hasSession = false;

  if (hasAddresses) {
    hasSession = normalizeWalletAddress(connectedAddress) === walletAddress;
  }

  return hasSession;
}
