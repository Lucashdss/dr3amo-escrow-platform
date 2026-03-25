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
import { getEscrowErrorMessage } from "@/features/escrows/services/validation";
import type {
  EscrowActionKey,
  EscrowLiveSnapshot,
  EscrowLiveState,
  EscrowManagementItem,
  TokenSymbol,
} from "@/features/escrows/types/escrow";
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
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
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

export function mapEscrowLiveStateToDatabaseState(
  liveEscrowState: EscrowLiveState | null
): string | null {
  if (!liveEscrowState) {
    return null;
  }

  return liveEscrowState;
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

function normalizeDatabaseState(state: string): string {
  return state.trim().toLowerCase();
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

  if (normalizeDatabaseState(currentState) === "created") {
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
