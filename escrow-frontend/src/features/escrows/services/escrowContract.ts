import {
  getPublicClient,
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import {
  decodeFunctionData,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
} from "viem";

import {
  ESCROW_ABI,
  getEscrowLiveStateFromIndex,
} from "@/features/escrows/config/escrowContract";
import { getEscrowErrorMessage, getTokenAddress } from "@/features/escrows/services/validation";
import type {
  EscrowActionKey,
  EscrowChainKey,
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

type EscrowSyncSnapshot = {
  amount: string;
  deadline: string;
  state: string;
};

type FundReceiptUpdate = {
  amount: string;
  deadline: string;
  state: string;
};

const DATABASE_TO_CHAIN_KEY: Record<number, EscrowChainKey> = {
  1: "base",
  2: "baseSepolia",
};

const DATABASE_TO_SUPPORTED_CHAIN_ID: Record<number, SupportedChainId> = {
  1: 8453,
  2: 84532,
};

const RELEVANT_ESCROW_EVENTS = new Set([
  "DeliveryConfirmed",
  "DisputeInitiated",
  "FundsRefunded",
  "FundsReleased",
  "MinimumPriceUpdated",
  "StateChanged",
  "UpfrontPaymentSent",
]);

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

export function getEscrowChainKey(databaseChainId: number): EscrowChainKey {
  const chainKey = DATABASE_TO_CHAIN_KEY[databaseChainId];

  if (!chainKey) {
    throw new AppError("Unsupported escrow chain.", 400);
  }

  return chainKey;
}

export function getEscrowTokenSymbol(tokenId: number): TokenSymbol {
  if (tokenId === 3) {
    return "ETH";
  }

  return "USDC";
}

function getContractAddress(address: string): Address {
  return address as Address;
}

function formatContractDeadline(deadline: bigint): string {
  return new Date(Number(deadline) * 1000).toISOString().slice(0, 10);
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
  const tokenSymbol = getEscrowTokenSymbol(input.tokenId);

  if (input.action === "fund" && input.amount !== null) {
    const txHash = await writeContract(config, {
      abi: ESCROW_ABI,
      address,
      args: [input.amount],
      chainId,
      functionName: "fund",
      value: tokenSymbol === "ETH" ? input.amount : BigInt(0),
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
  return waitForTransactionReceipt(config, {
    chainId: getSupportedChainId(databaseChainId),
    hash: txHash,
  });
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
    amount: amountToRelease.toString(),
    deadline: formatContractDeadline(deadline),
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
    amount: (BigInt(escrow.amount) + fundedAmount).toString(),
    deadline: escrow.deadline,
    state: getUpdatedStateFromLogs(logs, escrow.state),
  };
}

export function getEscrowTokenContractAddress(
  tokenId: number,
  chainId: number
): Address {
  return getTokenAddress(getEscrowTokenSymbol(tokenId), getEscrowChainKey(chainId));
}
