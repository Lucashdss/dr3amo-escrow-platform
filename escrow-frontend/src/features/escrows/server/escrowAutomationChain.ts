import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
} from "viem";
import { base, baseSepolia } from "viem/chains";

import {
  ESCROW_ABI,
  getEscrowLiveStateFromIndex,
} from "@/features/escrows/config/escrowContract";
import {
  getEscrowTokenDecimals,
  normalizeEscrowDatabaseState,
} from "@/features/escrows/services/escrowShared";
import type {
  EscrowLiveState,
  EscrowPersistedSnapshot,
} from "@/features/escrows/types/escrow";
import { AppError } from "@/lib/errors";

type SupportedChainId = 8453 | 84532;

type RefundCandidate = {
  contractAddress: string;
  txHash: string;
};

type EscrowChainTarget = {
  chainId: number;
  contractAddress: string;
  tokenId: number;
};

type ParsedEscrowLog = {
  address: string;
  args?: unknown;
  eventName: string;
  transactionHash: string;
};

const DATABASE_TO_SUPPORTED_CHAIN_ID: Record<number, SupportedChainId> = {
  1: 8453,
  2: 84532,
};
const REFUNDED_STATE_INDEX = 5;

export async function listRefundCandidates(
  databaseChainId: number,
  contractAddresses: readonly string[],
  fromBlock: bigint,
  toBlock: bigint
): Promise<RefundCandidate[]> {
  const publicClient = createEscrowClient(databaseChainId);
  const logs = hasValues(contractAddresses)
    ? await publicClient.getLogs({
        address: createContractAddressList(contractAddresses),
        fromBlock,
        toBlock,
      })
    : [];

  return createRefundCandidates(logs, databaseChainId);
}

export async function getLatestEscrowBlockNumber(
  databaseChainId: number
): Promise<bigint> {
  const publicClient = createEscrowClient(databaseChainId);
  const blockNumber = await publicClient.getBlockNumber();

  return blockNumber;
}

export async function readCurrentEscrowSnapshot(
  escrow: EscrowChainTarget
): Promise<EscrowPersistedSnapshot> {
  const publicClient = createEscrowClient(escrow.chainId);
  const address = getContractAddress(escrow.contractAddress);
  const [amountToRelease, deadline, stateIndex, modificationsRequested] =
    await Promise.all([
      publicClient.readContract({
        abi: ESCROW_ABI,
        address,
        functionName: "getAmountToRelease",
      }),
      publicClient.readContract({
        abi: ESCROW_ABI,
        address,
        functionName: "getDeadline",
      }),
      publicClient.readContract({
        abi: ESCROW_ABI,
        address,
        functionName: "getEscrowState",
      }),
      publicClient.readContract({
        abi: ESCROW_ABI,
        address,
        functionName: "getModificationsRequested",
      }),
    ]);
  const liveState = getEscrowLiveStateFromIndex(Number(stateIndex));

  return normalizeSnapshotState({
    amount: formatEscrowAmountForStorage(amountToRelease, escrow.tokenId),
    deadline: formatContractDeadline(deadline),
    modificationsRequested: Number(modificationsRequested),
    state: mapEscrowLiveStateToDatabaseState(liveState) ?? "created",
  });
}

export async function verifyRefundTransaction(
  databaseChainId: number,
  contractAddress: string,
  tokenId: number,
  txHash: string
): Promise<EscrowPersistedSnapshot> {
  const receipt = await getTransactionReceipt(databaseChainId, txHash);
  const snapshot = await readCurrentEscrowSnapshot({
    chainId: databaseChainId,
    contractAddress,
    tokenId,
  });

  assertSuccessfulReceipt(receipt.status);
  assertRefundEvidence(receipt.logs, contractAddress);
  assertRefundedSnapshot(snapshot);

  return normalizeSnapshotState(snapshot);
}

function createEscrowClient(databaseChainId: number) {
  const chainId = getSupportedChainId(databaseChainId);
  const publicClient = createPublicClient({
    chain: chainId === base.id ? base : baseSepolia,
    transport: http(),
  });

  return publicClient;
}

function getSupportedChainId(databaseChainId: number): SupportedChainId {
  const supportedChainId = DATABASE_TO_SUPPORTED_CHAIN_ID[databaseChainId];

  if (!supportedChainId) {
    throw new AppError("Unsupported escrow chain.", 400);
  }

  return supportedChainId;
}

async function getTransactionReceipt(databaseChainId: number, txHash: string) {
  const publicClient = createEscrowClient(databaseChainId);
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex });

  return receipt;
}

function createRefundCandidates(
  logs: readonly Log[],
  databaseChainId: number
): RefundCandidate[] {
  const candidates: RefundCandidate[] = [];
  const keySet = new Set<string>();
  const parsedLogs = parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...logs],
    strict: false,
  });

  parsedLogs.forEach((log) => {
    pushRefundCandidateIfNeeded(candidates, keySet, log, databaseChainId);
  });

  return candidates;
}

function pushRefundCandidateIfNeeded(
  candidates: RefundCandidate[],
  keySet: Set<string>,
  log: ParsedEscrowLog,
  databaseChainId: number
): void {
  if (hasRefundEventLog(log)) {
    pushRefundCandidate(
      candidates,
      keySet,
      log.address,
      log.transactionHash,
      databaseChainId
    );
  }
}

function pushRefundCandidate(
  candidates: RefundCandidate[],
  keySet: Set<string>,
  contractAddress: string,
  txHash: string,
  databaseChainId: number
): void {
  const candidateKey = `${databaseChainId}:${txHash}:${contractAddress.toLowerCase()}`;

  if (!keySet.has(candidateKey)) {
    keySet.add(candidateKey);
    candidates.push({ contractAddress, txHash });
  }
}

function hasRefundEventLog(log: ParsedEscrowLog): boolean {
  const nextState =
    log.eventName === "StateChanged"
      ? (log.args as { newState?: bigint | number }).newState
      : undefined;
  const isRefundedState =
    log.eventName === "StateChanged" &&
    ((typeof nextState === "number" && nextState === REFUNDED_STATE_INDEX) ||
      (typeof nextState === "bigint" &&
        nextState === BigInt(REFUNDED_STATE_INDEX)));
  const isFundsRefunded = log.eventName === "FundsRefunded";

  return isRefundedState || isFundsRefunded;
}

function assertSuccessfulReceipt(status: string): void {
  if (status !== "success") {
    throw new AppError("The escrow transaction was not successful.", 400);
  }
}

function assertRefundEvidence(logs: readonly Log[], contractAddress: string): void {
  if (!hasRefundEvent(logs, contractAddress)) {
    throw new AppError("The transaction does not contain refund evidence.", 400);
  }
}

function assertRefundedSnapshot(snapshot: EscrowPersistedSnapshot): void {
  if (normalizeEscrowDatabaseState(snapshot.state) !== "refunded") {
    throw new AppError("The current on-chain escrow state is not refunded.", 400);
  }
}

function hasRefundEvent(logs: readonly Log[], contractAddress: string): boolean {
  const isRefundState = getStateChangeName(logs, contractAddress) === "refunded";
  const hasFundsRefunded = hasEscrowEvent(logs, contractAddress, "FundsRefunded");

  return isRefundState || hasFundsRefunded;
}

function getStateChangeName(
  logs: readonly Log[],
  contractAddress: string
): string | null {
  const parsedLogs = parseEscrowReceiptLogs(logs, contractAddress);
  const stateChangedLog = parsedLogs.find((log) => log.eventName === "StateChanged");
  const nextState = stateChangedLog?.args?.newState;
  const liveState =
    typeof nextState === "number" || typeof nextState === "bigint"
      ? getEscrowLiveStateFromIndex(Number(nextState))
      : null;

  return mapEscrowLiveStateToDatabaseState(liveState);
}

function hasEscrowEvent(
  logs: readonly Log[],
  contractAddress: string,
  eventName: string
): boolean {
  const parsedLogs = parseEscrowReceiptLogs(logs, contractAddress);

  return parsedLogs.some((log) => log.eventName === eventName);
}

function parseEscrowReceiptLogs(logs: readonly Log[], contractAddress: string) {
  const contractLogs = logs.filter((log) => isSameAddress(log.address, contractAddress));

  return parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...contractLogs],
    strict: false,
  });
}

function formatContractDeadline(deadline: bigint): string {
  const formattedDeadline = new Date(Number(deadline) * 1000)
    .toISOString()
    .slice(0, 10);

  return formattedDeadline;
}

function formatEscrowAmountForStorage(value: bigint, tokenId: number): string {
  const formattedAmount = formatUnits(value, getEscrowTokenDecimals(tokenId));

  return normalizeStoredAmount(formattedAmount);
}

function normalizeStoredAmount(value: string): string {
  const normalizedValue = value.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
  const amount = normalizedValue === "" ? "0" : normalizedValue;

  return amount;
}

function normalizeSnapshotState(
  snapshot: EscrowPersistedSnapshot
): EscrowPersistedSnapshot {
  return {
    ...snapshot,
    state: normalizeEscrowDatabaseState(snapshot.state),
  };
}

function mapEscrowLiveStateToDatabaseState(
  liveEscrowState: EscrowLiveState | null
): string | null {
  const state = liveEscrowState
    ? normalizeEscrowDatabaseState(liveEscrowState)
    : null;

  return state;
}

function createContractAddressList(addresses: readonly string[]): Address[] {
  const contractAddresses = addresses.map((address) => getContractAddress(address));

  return contractAddresses;
}

function getContractAddress(address: string): Address {
  const contractAddress = getAddress(address);

  return contractAddress;
}

function isSameAddress(left: string, right: string): boolean {
  const isSame = getContractAddress(left) === getContractAddress(right);

  return isSame;
}

function hasValues<T>(values: readonly T[]): boolean {
  return values.length > 0;
}
