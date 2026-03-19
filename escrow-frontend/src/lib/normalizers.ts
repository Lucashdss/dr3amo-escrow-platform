export function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function normalizeUsernameLookup(value: string): string {
  return normalizeUsername(value).toLowerCase();
}
