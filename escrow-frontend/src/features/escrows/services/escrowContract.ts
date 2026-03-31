import {
  getPublicClient,
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import {
  getAddress,
  decodeFunctionData,
  formatUnits,
  parseEventLogs,
  parseUnits,
  type Address,
  type Hex,
  type Log,
} from "viem";

import {
  ESCROW_ABI,
  getEscrowLiveStateFromIndex,
} from "@/features/escrows/config/escrowContract";
import { FACTORY_ABI } from "@/features/escrows/config/factoryAbi";
import {
  ESCROW_DEPLOYMENT_CONFIGS,
  FACTORY_ADMIN_ADDRESS,
} from "@/features/escrows/config/deployment";
import {
  calculateDeliveryDays,
  getEscrowErrorMessage,
  getTokenAddress,
} from "@/features/escrows/services/validation";
import { extractEscrowCreatedLogArgs } from "@/features/escrows/services/escrowLogDecoder";
import type {
  ActiveEscrowMonitorState,
  EscrowChainKey,
  EscrowPersistedSnapshot,
  EscrowActionKey,
  EscrowLiveSnapshot,
  EscrowLiveState,
  EscrowManagementItem,
  TokenSymbol,
} from "@/features/escrows/types/escrow";
import { ACTIVE_ESCROW_MONITOR_STATES } from "@/features/escrows/types/escrow";
import { AppError } from "@/lib/errors";
import { config } from "@/lib/web3/wagmi";

type SupportedChainId = 8453 | 84532;

type ExecuteEscrowActionInput = {
  action: EscrowActionKey;
  amount: bigint | null;
  contractAddress: string;
  databaseChainId: number;
  deadlineExtensionDays: bigint | null;
  tokenId: number;
  usdAmount: bigint | null;
};

type ApproveEscrowFundingInput = {
  amount: bigint;
  contractAddress: string;
  databaseChainId: number;
  tokenAddress: string;
  tokenId: number;
  walletAddress: string;
};

type EscrowChainTarget = {
  chainId: number;
  contractAddress: string;
  tokenId: number;
};

type CreateEscrowVerificationInput = {
  authenticatedWalletAddress: string;
  chainKey: EscrowChainKey;
  databaseChainId: number;
  deliveryDays: number;
  freelancerWalletAddress: string;
  tokenId: number;
  tokenSymbol: TokenSymbol;
  txHash: string;
};

type EscrowActionVerificationInput = {
  action: EscrowActionKey;
  authenticatedWalletAddress: string;
  escrow: EscrowManagementItem;
  txHash: string;
};

export type RefundCandidate = {
  contractAddress: string;
  txHash: string;
};

type EscrowSyncSnapshot = {
  amount: string;
  deadline: string;
  modificationsRequested: number;
  state: string;
};

type FundReceiptUpdate = {
  amount: string;
  deadline: string;
  modificationsRequested: number;
  state: string;
};

type ModificationReceiptUpdate = {
  deadline: string;
  state: string;
};

const DATABASE_TO_SUPPORTED_CHAIN_ID: Record<number, SupportedChainId> = {
  1: 8453,
  2: 84532,
};

const RELEVANT_ESCROW_EVENTS = new Set([
  "ContractFunded",
  "DeliveryConfirmed",
  "DisputeInitiated",
  "FeeCharged",
  "FundsRefunded",
  "FundsReleased",
  "MinimumPriceUpdated",
  "StateChanged",
  "UpfrontPaymentSent",
]);
const REFUNDED_STATE_INDEX = 5;
const ESCROW_STATE_ALIASES: Record<string, string> = {
  cancelled: "canceled",
};
const ACTION_RESULT_STATES: Record<EscrowActionKey, readonly string[]> = {
  cancelEscrow: ["canceled"],
  confirmDelivery: ["released"],
  fund: ["funded"],
  initiateDispute: ["dispute"],
  markWorkSubmitted: ["work submitted"],
  requestModificationAndUpdateDeadline: ["pending modification"],
  setMinimumPriceUSD: ["created"],
};
const ESCROW_STATE_TRANSITIONS: Record<string, readonly string[]> = {
  created: ["funded", "canceled"],
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
  canceled: [],
};

const ERC20_ABI = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const ALLOWANCE_RECHECK_ATTEMPTS = 5;
const ALLOWANCE_RECHECK_DELAY_MS = 1000;

function getSupportedChainId(databaseChainId: number): SupportedChainId {
  const supportedChainId = DATABASE_TO_SUPPORTED_CHAIN_ID[databaseChainId];

  if (!supportedChainId) {
    throw new AppError("Unsupported escrow chain.", 400);
  }

  return supportedChainId;
}

export function getSupportedChainIdForEscrow(
  databaseChainId: number
): SupportedChainId {
  return getSupportedChainId(databaseChainId);
}

export function normalizeEscrowDatabaseState(state: string): string {
  const normalizedState = state.trim().toLowerCase();

  return ESCROW_STATE_ALIASES[normalizedState] ?? normalizedState;
}

function isKnownEscrowDatabaseState(state: string): boolean {
  return normalizeEscrowDatabaseState(state) in ESCROW_STATE_TRANSITIONS;
}

function getNextEscrowStates(state: string): readonly string[] {
  return ESCROW_STATE_TRANSITIONS[normalizeEscrowDatabaseState(state)] ?? [];
}

export function canReachEscrowState(
  currentState: string,
  nextState: string
): boolean {
  const normalizedCurrentState = normalizeEscrowDatabaseState(currentState);
  const normalizedNextState = normalizeEscrowDatabaseState(nextState);

  if (
    !isKnownEscrowDatabaseState(normalizedCurrentState) ||
    !isKnownEscrowDatabaseState(normalizedNextState)
  ) {
    return false;
  }

  if (normalizedCurrentState === normalizedNextState) {
    return true;
  }

  const statesToVisit = [normalizedCurrentState];
  const visitedStates = new Set<string>();

  while (statesToVisit.length > 0) {
    const state = statesToVisit.shift();

    if (!state || visitedStates.has(state)) {
      continue;
    }

    visitedStates.add(state);

    for (const candidateState of getNextEscrowStates(state)) {
      if (candidateState === normalizedNextState) {
        return true;
      }

      statesToVisit.push(candidateState);
    }
  }

  return false;
}

export function getEscrowTokenSymbol(tokenId: number): TokenSymbol {
  if (tokenId === 3) {
    return "ETH";
  }

  return "USDC";
}

function getEscrowTokenDecimals(tokenId: number): number {
  return getEscrowTokenSymbol(tokenId) === "USDC" ? 6 : 18;
}

function getContractAddress(address: string): Address {
  return getAddress(address);
}

function createContractAddressList(addresses: readonly string[]): Address[] {
  return addresses.map((address) => getContractAddress(address));
}

function hasValues<T>(values: readonly T[]): boolean {
  return values.length > 0;
}

function isSameAddress(left: string, right: string): boolean {
  return getContractAddress(left) === getContractAddress(right);
}

function isEthEscrowToken(tokenId: number): boolean {
  return getEscrowTokenSymbol(tokenId) === "ETH";
}

async function readTokenAllowance(
  tokenAddress: Address,
  walletAddress: Address,
  spenderAddress: Address,
  chainId: SupportedChainId
): Promise<bigint> {
  return readContract(config, {
    abi: ERC20_ABI,
    address: tokenAddress,
    args: [walletAddress, spenderAddress],
    chainId,
    functionName: "allowance",
  });
}

async function waitForAllowanceRefresh() {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ALLOWANCE_RECHECK_DELAY_MS);
  });
}

async function verifyAllowanceAfterApproval(
  tokenAddress: Address,
  walletAddress: Address,
  escrowAddress: Address,
  chainId: SupportedChainId,
  amount: bigint
): Promise<void> {
  for (let attempt = 0; attempt < ALLOWANCE_RECHECK_ATTEMPTS; attempt += 1) {
    const allowance = await readTokenAllowance(
      tokenAddress,
      walletAddress,
      escrowAddress,
      chainId
    );

    if (allowance >= amount) {
      return;
    }

    if (attempt < ALLOWANCE_RECHECK_ATTEMPTS - 1) {
      await waitForAllowanceRefresh();
    }
  }

  throw new AppError("Approval was confirmed but allowance is not visible yet.", 400);
}

async function waitForChainReceipt(
  databaseChainId: number,
  txHash: Hex
) {
  return waitForTransactionReceipt(config, {
    chainId: getSupportedChainId(databaseChainId),
    hash: txHash,
  });
}

export async function approveEscrowFundingIfNeeded(
  input: ApproveEscrowFundingInput
): Promise<Hex | null> {
  if (isEthEscrowToken(input.tokenId)) {
    return null;
  }

  const chainId = getSupportedChainId(input.databaseChainId);
  const escrowAddress = getContractAddress(input.contractAddress);
  const walletAddress = getContractAddress(input.walletAddress);
  const tokenAddress = getContractAddress(input.tokenAddress);
  const allowance = await readTokenAllowance(
    tokenAddress,
    walletAddress,
    escrowAddress,
    chainId
  );

  if (allowance >= input.amount) {
    return null;
  }

  const txHash = await writeContract(config, {
    abi: ERC20_ABI,
    address: tokenAddress,
    args: [escrowAddress, input.amount],
    chainId,
    functionName: "approve",
  });
  await waitForChainReceipt(input.databaseChainId, txHash);
  await verifyAllowanceAfterApproval(
    tokenAddress,
    walletAddress,
    escrowAddress,
    chainId,
    input.amount
  );

  return txHash;
}

function formatContractDeadline(deadline: bigint): string {
  return new Date(Number(deadline) * 1000).toISOString().slice(0, 10);
}

function formatDatabaseDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseStoredDeadline(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const datePortionMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})/);
  const normalizedValue = datePortionMatch
    ? `${datePortionMatch[1]}T00:00:00.000Z`
    : trimmedValue;
  const deadline = new Date(normalizedValue);

  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  return deadline;
}

function normalizeStoredAmount(value: string): string {
  const normalizedValue = value.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
  return normalizedValue === "" ? "0" : normalizedValue;
}

function formatEscrowAmountForStorage(value: bigint, tokenId: number): string {
  return normalizeStoredAmount(formatUnits(value, getEscrowTokenDecimals(tokenId)));
}

function parseStoredEscrowAmount(value: string, tokenId: number): bigint {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return BigInt(0);
  }

  return parseUnits(trimmedValue, getEscrowTokenDecimals(tokenId));
}

function getEscrowClient(databaseChainId: number) {
  return getPublicClient(config, {
    chainId: getSupportedChainId(databaseChainId),
  });
}

async function getTransactionBundle(databaseChainId: number, txHash: string) {
  const publicClient = getEscrowClient(databaseChainId);
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash as Hex,
  });
  const transaction = await publicClient.getTransaction({
    hash: txHash as Hex,
  });

  return { receipt, transaction };
}

function assertSuccessfulReceipt(status: string): void {
  if (status !== "success") {
    throw new AppError("The escrow transaction was not successful.", 400);
  }
}

function assertWalletActor(from: string, walletAddress: string): void {
  if (!isSameAddress(from, walletAddress)) {
    throw new AppError("The escrow transaction was not sent by the authenticated wallet.", 400);
  }
}

function assertTransactionTarget(
  targetAddress: string | null,
  expectedAddress: string,
  message: string
): void {
  if (!targetAddress || !isSameAddress(targetAddress, expectedAddress)) {
    throw new AppError(message, 400);
  }
}

function parseEscrowReceiptLogs(
  logs: readonly Log[],
  contractAddress: string
) {
  const contractLogs = logs.filter((log) => isSameAddress(log.address, contractAddress));

  return parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...contractLogs],
    strict: false,
  });
}

function parseFactoryReceiptLogs(
  logs: readonly Log[],
  factoryAddress: string
) {
  const factoryLogs = logs.filter((log) => isSameAddress(log.address, factoryAddress));

  return parseEventLogs({
    abi: FACTORY_ABI,
    logs: [...factoryLogs],
    strict: false,
  });
}

function assertSingleEscrowCreatedLog(
  logs: readonly Log[],
  factoryAddress: string
): void {
  const createdLogs = parseFactoryReceiptLogs(logs, factoryAddress).filter(
    (log) => log.eventName === "EscrowCreated"
  );

  if (createdLogs.length !== 1) {
    throw new AppError("Expected exactly one EscrowCreated event.", 400);
  }
}

function getStateChangeName(logs: readonly Log[], contractAddress: string): string | null {
  const parsedLogs = parseEscrowReceiptLogs(logs, contractAddress);
  const stateChangedLog = parsedLogs.find((log) => log.eventName === "StateChanged");
  const nextState = stateChangedLog?.args?.newState;
  const liveState =
    typeof nextState === "number" || typeof nextState === "bigint"
      ? getEscrowLiveStateFromIndex(Number(nextState))
      : null;

  return mapEscrowLiveStateToDatabaseState(liveState);
}

function assertKnownEscrowState(state: string, message: string): void {
  if (!isKnownEscrowDatabaseState(state)) {
    throw new AppError(message, 400);
  }
}

function assertActionResultState(action: EscrowActionKey, state: string): void {
  if (!ACTION_RESULT_STATES[action].includes(normalizeEscrowDatabaseState(state))) {
    throw new AppError("The resulting escrow state does not match the requested action.", 400);
  }
}

function assertReachableEscrowState(
  currentState: string,
  nextState: string,
  message: string
): void {
  if (!canReachEscrowState(currentState, nextState)) {
    throw new AppError(message, 400);
  }
}

function normalizeSnapshotState(
  snapshot: EscrowPersistedSnapshot
): EscrowPersistedSnapshot {
  return {
    ...snapshot,
    state: normalizeEscrowDatabaseState(snapshot.state),
  };
}

function hasEscrowEvent(
  logs: readonly Log[],
  contractAddress: string,
  eventName: string
): boolean {
  const parsedLogs = parseEscrowReceiptLogs(logs, contractAddress);
  return parsedLogs.some((log) => log.eventName === eventName);
}

function hasRefundEvent(logs: readonly Log[], contractAddress: string): boolean {
  const isRefundState = getStateChangeName(logs, contractAddress) === "refunded";
  const hasFundsRefunded = hasEscrowEvent(logs, contractAddress, "FundsRefunded");

  return isRefundState || hasFundsRefunded;
}

function assertCreateFunction(input: Hex) {
  const decodedInput = decodeFunctionData({
    abi: FACTORY_ABI,
    data: input,
  });

  if (decodedInput.functionName !== "createEscrow") {
    throw new AppError("The transaction is not a createEscrow call.", 400);
  }

  return decodedInput.args;
}

function assertCreateArguments(
  input: CreateEscrowVerificationInput,
  args: readonly unknown[]
): void {
  const [freelancer, deliveryPeriod, dataFeed, token, admin] = args;
  const deploymentConfig = ESCROW_DEPLOYMENT_CONFIGS[input.chainKey];
  const expectedToken = getTokenAddress(input.tokenSymbol, input.chainKey);

  if (!isSameAddress(String(freelancer), input.freelancerWalletAddress)) {
    throw new AppError("The transaction freelancer does not match the request.", 400);
  }

  if (!isSameAddress(String(dataFeed), deploymentConfig.dataFeedAddress)) {
    throw new AppError("The transaction data feed does not match the configured chain.", 400);
  }

  if (!isSameAddress(String(token), expectedToken)) {
    throw new AppError("The transaction token does not match the request.", 400);
  }

  if (!isSameAddress(String(admin), FACTORY_ADMIN_ADDRESS)) {
    throw new AppError("The transaction admin does not match the configured factory admin.", 400);
  }

  if (deliveryPeriod !== BigInt(input.deliveryDays)) {
    throw new AppError("The transaction delivery period does not match the request.", 400);
  }
}

function assertEscrowCreatedArguments(
  input: CreateEscrowVerificationInput,
  args: Record<string, unknown>,
  factoryArgs: readonly unknown[]
): void {
  const [freelancer, deliveryPeriod, dataFeed, token, , bps] = factoryArgs;

  if (!isSameAddress(String(args.client), input.authenticatedWalletAddress)) {
    throw new AppError("EscrowCreated client does not match the authenticated wallet.", 400);
  }

  if (!isSameAddress(String(args.freelancer), String(freelancer))) {
    throw new AppError("EscrowCreated freelancer does not match the transaction.", 400);
  }

  if (!isSameAddress(String(args.token), String(token))) {
    throw new AppError("EscrowCreated token does not match the transaction.", 400);
  }

  if (!isSameAddress(String(args.dataFeed), String(dataFeed))) {
    throw new AppError("EscrowCreated data feed does not match the transaction.", 400);
  }

  if (args.deliveryPeriod !== deliveryPeriod || args.bps !== bps) {
    throw new AppError("EscrowCreated arguments do not match the transaction.", 400);
  }
}

function assertActionFunction(action: EscrowActionKey, input: Hex): void {
  const decodedInput = decodeFunctionData({
    abi: ESCROW_ABI,
    data: input,
  });
  const functionName = decodedInput.functionName;
  const matchesAction = functionName === action;

  if (!matchesAction) {
    throw new AppError("The transaction function does not match the requested action.", 400);
  }
}

function assertActionReceiptEvidence(
  action: EscrowActionKey,
  logs: readonly Log[],
  contractAddress: string
): void {
  const nextState = getStateChangeName(logs, contractAddress);
  const evidenceByAction: Record<EscrowActionKey, boolean> = {
    cancelEscrow:
      nextState === "canceled" || hasEscrowEvent(logs, contractAddress, "FundsRefunded"),
    confirmDelivery:
      nextState === "released" ||
      hasEscrowEvent(logs, contractAddress, "DeliveryConfirmed") ||
      hasEscrowEvent(logs, contractAddress, "FundsReleased"),
    fund:
      nextState === "funded" ||
      hasEscrowEvent(logs, contractAddress, "UpfrontPaymentSent"),
    initiateDispute:
      nextState === "dispute" ||
      hasEscrowEvent(logs, contractAddress, "DisputeInitiated"),
    markWorkSubmitted: nextState === "work submitted",
    requestModificationAndUpdateDeadline: nextState === "pending modification",
    setMinimumPriceUSD: hasEscrowEvent(logs, contractAddress, "MinimumPriceUpdated"),
  };

  if (!evidenceByAction[action]) {
    throw new AppError("The escrow receipt does not contain the expected action evidence.", 400);
  }
}

function createRefundCandidateKey(
  databaseChainId: number,
  txHash: string,
  contractAddress: string
): string {
  return `${databaseChainId}:${txHash}:${contractAddress.toLowerCase()}`;
}

function createEmptyCandidates(): RefundCandidate[] {
  return [];
}

function pushRefundCandidate(
  candidates: RefundCandidate[],
  keySet: Set<string>,
  contractAddress: string,
  txHash: string,
  databaseChainId: number
): void {
  const candidateKey = createRefundCandidateKey(
    databaseChainId,
    txHash,
    contractAddress
  );

  if (!keySet.has(candidateKey)) {
    keySet.add(candidateKey);
    candidates.push({ contractAddress, txHash });
  }
}

export async function readCurrentEscrowSnapshot(
  escrow: EscrowChainTarget
): Promise<EscrowPersistedSnapshot> {
  const chainId = getSupportedChainId(escrow.chainId);
  const address = getContractAddress(escrow.contractAddress);
  const [amountToRelease, deadline, stateIndex, modificationsRequested] =
    await Promise.all([
      readContract(config, {
        abi: ESCROW_ABI,
        address,
        chainId,
        functionName: "getAmountToRelease",
      }),
      readContract(config, {
        abi: ESCROW_ABI,
        address,
        chainId,
        functionName: "getDeadline",
      }),
      readContract(config, {
        abi: ESCROW_ABI,
        address,
        chainId,
        functionName: "getEscrowState",
      }),
      readContract(config, {
        abi: ESCROW_ABI,
        address,
        chainId,
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

export async function verifyCreateEscrowTransaction(
  input: CreateEscrowVerificationInput
): Promise<{ contractAddress: string; snapshot: EscrowPersistedSnapshot }> {
  const deploymentConfig = ESCROW_DEPLOYMENT_CONFIGS[input.chainKey];
  const { receipt, transaction } = await getTransactionBundle(
    input.databaseChainId,
    input.txHash
  );
  const factoryArgs = assertCreateFunction(transaction.input);
  const factoryLogs = receipt.logs.filter((log: (typeof receipt.logs)[number]) =>
    isSameAddress(log.address, deploymentConfig.factoryAddress)
  );

  assertSingleEscrowCreatedLog(receipt.logs, deploymentConfig.factoryAddress);

  const createdArgs = extractEscrowCreatedLogArgs(factoryLogs);

  if (!createdArgs) {
    throw new AppError("EscrowCreated event could not be decoded.", 400);
  }

  const contractAddress = createdArgs.escrow;
  const snapshot = await readCurrentEscrowSnapshot({
    chainId: input.databaseChainId,
    contractAddress,
    tokenId: input.tokenId,
  });

  assertSuccessfulReceipt(receipt.status);
  assertWalletActor(transaction.from, input.authenticatedWalletAddress);
  assertTransactionTarget(
    transaction.to,
    deploymentConfig.factoryAddress,
    "The transaction target does not match the configured factory."
  );
  assertCreateArguments(input, factoryArgs);
  assertEscrowCreatedArguments(input, createdArgs, factoryArgs);

  return { contractAddress, snapshot };
}

export async function verifyEscrowActionTransaction(
  input: EscrowActionVerificationInput
): Promise<EscrowPersistedSnapshot> {
  const { receipt, transaction } = await getTransactionBundle(
    input.escrow.chainId,
    input.txHash
  );

  assertSuccessfulReceipt(receipt.status);
  assertWalletActor(transaction.from, input.authenticatedWalletAddress);
  assertTransactionTarget(
    transaction.to,
    input.escrow.contractAddress,
    "The transaction target does not match the escrow contract."
  );
  assertActionFunction(input.action, transaction.input);
  assertActionReceiptEvidence(input.action, receipt.logs, input.escrow.contractAddress);

  const snapshot = await readCurrentEscrowSnapshot({
    chainId: input.escrow.chainId,
    contractAddress: input.escrow.contractAddress,
    tokenId: input.escrow.tokenId,
  });

  assertKnownEscrowState(snapshot.state, "The resulting escrow state is unknown.");
  assertActionResultState(input.action, snapshot.state);
  assertReachableEscrowState(
    input.escrow.state,
    snapshot.state,
    "The resulting escrow state is not reachable from the stored escrow state."
  );

  return snapshot;
}

export function isAutomationMonitoringState(state: string): boolean {
  return ACTIVE_ESCROW_MONITOR_STATES.includes(
    state.toLowerCase() as ActiveEscrowMonitorState
  );
}

export async function listRefundCandidates(
  databaseChainId: number,
  contractAddresses: readonly string[],
  fromBlock: bigint,
  toBlock: bigint
): Promise<RefundCandidate[]> {
  const publicClient = getEscrowClient(databaseChainId);
  const logs = hasValues(contractAddresses)
    ? await publicClient.getLogs({
        address: createContractAddressList(contractAddresses),
        fromBlock,
        toBlock,
      })
    : [];
  const candidates = createEmptyCandidates();
  const keySet = new Set<string>();
  const parsedLogs = parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...logs],
    strict: false,
  });

  parsedLogs.forEach((log) => {
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

    if (isRefundedState || isFundsRefunded) {
      pushRefundCandidate(
        candidates,
        keySet,
        log.address,
        log.transactionHash,
        databaseChainId
      );
    }
  });

  return candidates;
}

export async function getLatestEscrowBlockNumber(
  databaseChainId: number
): Promise<bigint> {
  const publicClient = getEscrowClient(databaseChainId);
  return publicClient.getBlockNumber();
}

export async function verifyRefundTransaction(
  databaseChainId: number,
  contractAddress: string,
  tokenId: number,
  txHash: string
): Promise<EscrowPersistedSnapshot> {
  const { receipt } = await getTransactionBundle(databaseChainId, txHash);
  const snapshot = await readCurrentEscrowSnapshot({
    chainId: databaseChainId,
    contractAddress,
    tokenId,
  });

  assertSuccessfulReceipt(receipt.status);

  if (!hasRefundEvent(receipt.logs, contractAddress)) {
    throw new AppError("The transaction does not contain refund evidence.", 400);
  }

  if (normalizeEscrowDatabaseState(snapshot.state) !== "refunded") {
    throw new AppError("The current on-chain escrow state is not refunded.", 400);
  }

  return normalizeSnapshotState(snapshot);
}

export function mapEscrowLiveStateToDatabaseState(
  liveEscrowState: EscrowLiveState | null
): string | null {
  if (!liveEscrowState) {
    return null;
  }

  return normalizeEscrowDatabaseState(liveEscrowState);
}

export async function readEscrowLiveSnapshot(
  escrow: EscrowManagementItem
): Promise<EscrowLiveSnapshot> {
  const chainId = getSupportedChainId(escrow.chainId);
  const address = getContractAddress(escrow.contractAddress);
  const [minimumPriceUsd, modificationsRequested] = await Promise.all([
    readContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "getMinimumPriceUSD",
    }),
    readContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "getModificationsRequested",
    }),
  ]);

  return {
    minimumPriceUsd: minimumPriceUsd.toString(),
    modificationsRequested: Number(modificationsRequested),
  };
}

export async function readEscrowLiveState(
  escrow: EscrowManagementItem
): Promise<EscrowLiveState | null> {
  const chainId = getSupportedChainId(escrow.chainId);
  const stateIndex = await readContract(config, {
    abi: ESCROW_ABI,
    address: getContractAddress(escrow.contractAddress),
    chainId,
    functionName: "getEscrowState",
  });

  return getEscrowLiveStateFromIndex(Number(stateIndex));
}

export async function executeEscrowAction(
  input: ExecuteEscrowActionInput
): Promise<{ txHash: Hex }> {
  const chainId = getSupportedChainId(input.databaseChainId);
  const address = getContractAddress(input.contractAddress);

  if (input.action === "cancelEscrow") {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "cancelEscrow",
    });

    return { txHash };
  }

  if (input.action === "fund" && input.amount !== null) {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      args: [input.amount],
      chainId,
      functionName: "fund",
      value: isEthEscrowToken(input.tokenId) ? input.amount : BigInt(0),
    });

    return { txHash };
  }

  if (input.action === "setMinimumPriceUSD" && input.usdAmount !== null) {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      args: [input.usdAmount],
      chainId,
      functionName: "setMinimumPriceUSD",
    });

    return { txHash };
  }

  if (
    input.action === "requestModificationAndUpdateDeadline" &&
    input.deadlineExtensionDays !== null
  ) {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      args: [input.deadlineExtensionDays],
      chainId,
      functionName: "requestModificationAndUpdateDeadline",
    });

    return { txHash };
  }

  if (input.action === "confirmDelivery") {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "confirmDelivery",
    });

    return { txHash };
  }

  if (input.action === "initiateDispute") {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "initiateDispute",
    });

    return { txHash };
  }

  if (input.action === "markWorkSubmitted") {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "markWorkSubmitted",
    });

    return { txHash };
  }

  throw new AppError("Invalid escrow action input.", 400);
}

export async function waitForEscrowActionReceipt(
  databaseChainId: number,
  txHash: Hex
) {
  return waitForChainReceipt(databaseChainId, txHash);
}

export function decodeEscrowReceiptEventNames(logs: readonly Log[]): string[] {
  const parsedLogs = parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...logs],
    strict: false,
  });

  return parsedLogs
    .map((log) => log.eventName)
    .filter((eventName) => Boolean(eventName) && RELEVANT_ESCROW_EVENTS.has(eventName));
}

function parseFundTransactionAmount(input: Hex): bigint | null {
  try {
    const decodedTransaction = decodeFunctionData({
      abi: ESCROW_ABI,
      data: input,
    });

    if (decodedTransaction.functionName !== "fund") {
      return null;
    }

    const [amount] = decodedTransaction.args;
    return typeof amount === "bigint" ? amount : null;
  } catch {
    return null;
  }
}

function parseModificationExtensionDays(input: Hex): bigint | null {
  try {
    const decodedTransaction = decodeFunctionData({
      abi: ESCROW_ABI,
      data: input,
    });

    if (
      decodedTransaction.functionName !== "requestModificationAndUpdateDeadline"
    ) {
      return null;
    }

    const [extensionDays] = decodedTransaction.args;
    return typeof extensionDays === "bigint" ? extensionDays : null;
  } catch {
    return null;
  }
}

function getUpdatedStateFromLogs(
  logs: readonly Log[],
  currentState: string
): string {
  const parsedLogs = parseEventLogs({
    abi: ESCROW_ABI,
    logs: [...logs],
    strict: false,
  });
  const stateChangedLog = parsedLogs.find(
    (log) => log.eventName === "StateChanged"
  );
  const nextState = stateChangedLog?.args?.newState;

  if (typeof nextState === "number" || typeof nextState === "bigint") {
    return (
      mapEscrowLiveStateToDatabaseState(
        getEscrowLiveStateFromIndex(Number(nextState))
      ) ?? currentState
    );
  }

  if (normalizeEscrowDatabaseState(currentState) === "created") {
    return "funded";
  }

  return currentState;
}

export async function readEscrowSyncSnapshot(
  escrow: EscrowManagementItem
): Promise<EscrowSyncSnapshot> {
  const chainId = getSupportedChainId(escrow.chainId);
  const address = getContractAddress(escrow.contractAddress);
  const [amountToRelease, deadline, stateIndex] = await Promise.all([
    readContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "getAmountToRelease",
    }),
    readContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "getDeadline",
    }),
    readContract(config, {
      abi: ESCROW_ABI,
      address,
      chainId,
      functionName: "getEscrowState",
    }),
  ]);
  const liveState = getEscrowLiveStateFromIndex(Number(stateIndex));

  return {
    amount: formatEscrowAmountForStorage(amountToRelease, escrow.tokenId),
    deadline: formatContractDeadline(deadline),
    modificationsRequested: escrow.modificationsRequested ?? 0,
    state: mapEscrowLiveStateToDatabaseState(liveState) ?? escrow.state,
  };
}

export async function getEscrowSyncReceipt(
  databaseChainId: number,
  txHash: string
) {
  try {
    const publicClient = getPublicClient(config, {
      chainId: getSupportedChainId(databaseChainId),
    });

    return await publicClient.getTransactionReceipt({
      hash: txHash as Hex,
    });
  } catch (error) {
    throw new AppError(
      getEscrowErrorMessage(error, "Failed to load the escrow transaction receipt."),
      400
    );
  }
}

export async function getFundReceiptUpdate(
  escrow: EscrowManagementItem,
  txHash: string,
  logs: readonly Log[]
): Promise<FundReceiptUpdate> {
  const publicClient = getPublicClient(config, {
    chainId: getSupportedChainId(escrow.chainId),
  });
  const transaction = await publicClient.getTransaction({
    hash: txHash as Hex,
  });
  const fundedAmount = parseFundTransactionAmount(transaction.input);

  if (fundedAmount === null) {
    throw new AppError("Failed to decode the funded amount from the transaction.", 400);
  }

  return {
    amount: formatEscrowAmountForStorage(
      parseStoredEscrowAmount(escrow.amount, escrow.tokenId) + fundedAmount,
      escrow.tokenId
    ),
    deadline: escrow.deadline,
    modificationsRequested: escrow.modificationsRequested ?? 0,
    state: getUpdatedStateFromLogs(logs, escrow.state),
  };
}

export async function getModificationReceiptUpdate(
  escrow: EscrowManagementItem,
  txHash: string
): Promise<ModificationReceiptUpdate> {
  const publicClient = getPublicClient(config, {
    chainId: getSupportedChainId(escrow.chainId),
  });
  const transaction = await publicClient.getTransaction({
    hash: txHash as Hex,
  });
  const extensionDays = parseModificationExtensionDays(transaction.input);

  if (extensionDays === null) {
    throw new AppError(
      "Failed to decode the modification extension from the transaction.",
      400
    );
  }

  const deadline = parseStoredDeadline(escrow.deadline);

  if (!deadline) {
    throw new AppError("The escrow deadline could not be parsed.", 400);
  }

  deadline.setUTCDate(deadline.getUTCDate() + Number(extensionDays));

  return {
    deadline: formatDatabaseDate(deadline),
    state: "pending modification",
  };
}
