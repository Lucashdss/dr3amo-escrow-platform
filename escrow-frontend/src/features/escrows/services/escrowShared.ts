import type { TokenSymbol } from "@/features/escrows/types/escrow";

const ESCROW_STATE_ALIASES: Record<string, string> = {
  canceled: "cancelled",
};
const ESCROW_STATE_TRANSITIONS: Record<string, readonly string[]> = {
  created: ["funded", "cancelled"],
  funded: ["funded", "work submitted", "dispute", "refunded"],
  "work submitted": [
    "work submitted",
    "pending modification",
    "released",
    "dispute",
    "refunded",
  ],
  "pending modification": [
    "pending modification",
    "work submitted",
    "dispute",
    "refunded",
  ],
  released: [],
  refunded: [],
  dispute: [],
  cancelled: [],
};

export function normalizeEscrowDatabaseState(state: string): string {
  const normalizedState = state.trim().toLowerCase();

  return ESCROW_STATE_ALIASES[normalizedState] ?? normalizedState;
}

export function isKnownEscrowDatabaseState(state: string): boolean {
  return normalizeEscrowDatabaseState(state) in ESCROW_STATE_TRANSITIONS;
}

export function canReachEscrowState(
  currentState: string,
  nextState: string
): boolean {
  const normalizedCurrentState = normalizeEscrowDatabaseState(currentState);
  const normalizedNextState = normalizeEscrowDatabaseState(nextState);
  let canReach = false;

  if (canVisitEscrowState(normalizedCurrentState, normalizedNextState)) {
    canReach = findReachableEscrowState(normalizedCurrentState, normalizedNextState);
  }

  return canReach;
}

export function getEscrowTokenSymbol(tokenId: number): TokenSymbol {
  let tokenSymbol: TokenSymbol = "USDC";

  if (tokenId === 3) {
    tokenSymbol = "ETH";
  }

  return tokenSymbol;
}

export function getEscrowTokenDecimals(tokenId: number): number {
  const decimals = getEscrowTokenSymbol(tokenId) === "USDC" ? 6 : 18;

  return decimals;
}

function canVisitEscrowState(currentState: string, nextState: string): boolean {
  const canVisit =
    isKnownEscrowDatabaseState(currentState) && isKnownEscrowDatabaseState(nextState);

  return canVisit;
}

function findReachableEscrowState(currentState: string, nextState: string): boolean {
  const statesToVisit = [currentState];
  const visitedStates = new Set<string>();
  let canReach = currentState === nextState;

  while (!canReach && statesToVisit.length > 0) {
    canReach = visitNextEscrowState(statesToVisit, visitedStates, nextState);
  }

  return canReach;
}

function visitNextEscrowState(
  statesToVisit: string[],
  visitedStates: Set<string>,
  nextState: string
): boolean {
  const state = statesToVisit.shift();
  let canReach = false;

  if (state && !visitedStates.has(state)) {
    visitedStates.add(state);
    canReach = enqueueEscrowStateTransitions(state, nextState, statesToVisit);
  }

  return canReach;
}

function enqueueEscrowStateTransitions(
  state: string,
  nextState: string,
  statesToVisit: string[]
): boolean {
  let canReach = false;

  for (const candidateState of getNextEscrowStates(state)) {
    canReach = canReach || candidateState === nextState;
    statesToVisit.push(candidateState);
  }

  return canReach;
}

function getNextEscrowStates(state: string): readonly string[] {
  const states = ESCROW_STATE_TRANSITIONS[normalizeEscrowDatabaseState(state)] ?? [];

  return states;
}
