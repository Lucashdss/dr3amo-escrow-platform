import { isEscrowAutomationEnabled } from "@/lib/env/server";
import {
  getLatestEscrowBlockNumber,
  listRefundCandidates,
} from "./escrowAutomationChain";

import {
  listActiveEscrowMonitoringTargets,
  reconcileActiveEscrows,
  syncAutomatedRefundEscrow,
} from "./escrowAutomationService";
import {
  findMonitorStateByChainId,
  upsertMonitorState,
} from "./escrowRepository";

const LOG_POLL_INTERVAL_MS = 30_000;
const MAX_REFUND_SYNC_RETRIES = 2;
const MAX_PROCESSED_KEYS = 1000;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;
const REFUND_POLLING_PENDING_RETRIES_MESSAGE =
  "Refund polling has pending retry failures.";

export type EscrowAutomationStepName = "refundPolling" | "reconciliation";

export type EscrowAutomationStepResult =
  | Readonly<{
      status: "completed";
      step: EscrowAutomationStepName;
    }>
  | Readonly<{
      errorMessage: string;
      status: "failed";
      step: EscrowAutomationStepName;
    }>;

export type EscrowAutomationRunResult = Readonly<{
  steps: readonly EscrowAutomationStepResult[];
  success: boolean;
}>;

declare global {
  // eslint-disable-next-line no-var
  var __escrowAutomationStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __escrowAutomationProcessedKeys: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __escrowAutomationRetryCounts: Map<string, number> | undefined;
}

function shouldStartEscrowAutomation(): boolean {
  const isNodeRuntime = process.env.NEXT_RUNTIME === "nodejs";
  const isTestEnvironment = process.env.NODE_ENV === "test";

  return isNodeRuntime && !isTestEnvironment && isEscrowAutomationEnabled();
}

function createProcessedKey(
  chainId: number,
  txHash: string,
  contractAddress: string
): string {
  return `${chainId}:${txHash}:${contractAddress.toLowerCase()}`;
}

function getProcessedKeys(): Set<string> {
  globalThis.__escrowAutomationProcessedKeys ??= new Set<string>();
  return globalThis.__escrowAutomationProcessedKeys;
}

function getRetryCounts(): Map<string, number> {
  globalThis.__escrowAutomationRetryCounts ??= new Map<string, number>();
  return globalThis.__escrowAutomationRetryCounts;
}

function clearProcessingCachesIfNeeded(): void {
  const processedKeys = getProcessedKeys();

  if (processedKeys.size >= MAX_PROCESSED_KEYS) {
    processedKeys.clear();
    getRetryCounts().clear();
  }
}

function markCandidateAsProcessed(processedKey: string): void {
  clearProcessingCachesIfNeeded();
  getProcessedKeys().add(processedKey);
  getRetryCounts().delete(processedKey);
}

function incrementRetryCount(processedKey: string): number {
  const retryCounts = getRetryCounts();
  const retryCount = (retryCounts.get(processedKey) ?? 0) + 1;

  retryCounts.set(processedKey, retryCount);
  return retryCount;
}

function shouldBlockCursorAdvance(retryCount: number): boolean {
  return retryCount <= MAX_REFUND_SYNC_RETRIES;
}

function logAutomationInfo(message: string, context?: Record<string, unknown>): void {
  console.info(`[escrow-automation] ${message}`, context ?? {});
}

function logAutomationError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[escrow-automation] ${message}`, {
    ...context,
    errorMessage,
  });
}

function groupTargetsByChain(
  targets: Awaited<ReturnType<typeof listActiveEscrowMonitoringTargets>>
): Map<number, string[]> {
  const groupedTargets = new Map<number, string[]>();

  for (const target of targets) {
    const existingTargets = groupedTargets.get(target.chainId) ?? [];
    existingTargets.push(target.contractAddress);
    groupedTargets.set(target.chainId, existingTargets);
  }

  return groupedTargets;
}

async function processRefundCandidatesForChain(
  chainId: number,
  contractAddresses: readonly string[]
): Promise<boolean> {
  const latestBlock = await getLatestEscrowBlockNumber(chainId);
  const monitorState = await findMonitorStateByChainId(chainId);
  const storedBlock = monitorState?.lastProcessedBlock;

  if (storedBlock === undefined) {
    await upsertMonitorState(chainId, latestBlock);
    logAutomationInfo("Seeded monitor cursor.", {
      chainId,
      latestBlock: latestBlock.toString(),
    });
    return true;
  }

  if (latestBlock <= storedBlock) {
    return true;
  }

  const fromBlock = storedBlock + BigInt(1);
  logAutomationInfo("Polling refund candidates.", {
    chainId,
    contractCount: contractAddresses.length,
    fromBlock: fromBlock.toString(),
    toBlock: latestBlock.toString(),
  });
  const candidates = await listRefundCandidates(
    chainId,
    contractAddresses,
    fromBlock,
    latestBlock
  );
  logAutomationInfo("Refund candidates found.", {
    candidateCount: candidates.length,
    chainId,
  });
  let hasBlockingFailure = false;

  for (const candidate of candidates) {
    const processedKeys = getProcessedKeys();
    const processedKey = createProcessedKey(
      chainId,
      candidate.txHash,
      candidate.contractAddress
    );

    if (!processedKeys.has(processedKey)) {
      try {
        await syncAutomatedRefundEscrow(
          chainId,
          candidate.contractAddress,
          candidate.txHash
        );
        markCandidateAsProcessed(processedKey);
      } catch (error) {
        const retryCount = incrementRetryCount(processedKey);
        const context = {
          chainId,
          contractAddress: candidate.contractAddress,
          maxRetries: MAX_REFUND_SYNC_RETRIES,
          retryCount,
          txHash: candidate.txHash,
        };

        if (shouldBlockCursorAdvance(retryCount)) {
          hasBlockingFailure = true;
          logAutomationError(
            "Refund candidate sync failed; cursor will retry this range.",
            error,
            context
          );
        } else {
          markCandidateAsProcessed(processedKey);
          logAutomationError(
            "Skipping refund candidate after retries exhausted.",
            error,
            context
          );
        }
      }
    }
  }

  if (hasBlockingFailure) {
    logAutomationInfo("Refund cursor not advanced because retries are pending.", {
      chainId,
      latestBlock: latestBlock.toString(),
    });
    return false;
  }

  await upsertMonitorState(chainId, latestBlock);
  return true;
}

async function pollRefundCandidates(): Promise<boolean> {
  const targets = await listActiveEscrowMonitoringTargets();
  const groupedTargets = groupTargetsByChain(targets);
  let completed = true;

  for (const [chainId, contractAddresses] of groupedTargets) {
    const chainCompleted = await processRefundCandidatesForChain(
      chainId,
      contractAddresses
    );

    completed = completed && chainCompleted;
  }

  return completed;
}

async function runReconciliation(): Promise<void> {
  const updatedCount = await reconcileActiveEscrows();

  logAutomationInfo("Reconciliation completed.", { updatedCount });
}

async function runRefundPollingStep(): Promise<void> {
  const completed = await pollRefundCandidates();

  if (!completed) {
    throw new Error(REFUND_POLLING_PENDING_RETRIES_MESSAGE);
  }
}

async function runMonitorRefundPolling(): Promise<void> {
  try {
    await pollRefundCandidates();
  } catch (error) {
    logAutomationError("Refund polling failed.", error);
  }
}

async function runMonitorReconciliation(): Promise<void> {
  try {
    await runReconciliation();
  } catch (error) {
    logAutomationError("Reconciliation failed.", error);
  }
}

async function runAutomationStep(
  step: EscrowAutomationStepName,
  task: () => Promise<void>
): Promise<EscrowAutomationStepResult> {
  let result: EscrowAutomationStepResult;

  try {
    await task();
    result = createCompletedStepResult(step);
  } catch (error) {
    result = createFailedStepResult(step, error);
    logAutomationError(`${step} failed.`, error);
  }

  return result;
}

export async function runEscrowAutomationOnce(): Promise<EscrowAutomationRunResult> {
  const refundPolling = await runAutomationStep(
    "refundPolling",
    runRefundPollingStep
  );
  const reconciliation = await runAutomationStep(
    "reconciliation",
    runReconciliation
  );
  const steps = [refundPolling, reconciliation] as const;

  return {
    steps,
    success: steps.every(isCompletedStepResult),
  };
}

export function startEscrowAutomationMonitor(): void {
  const shouldStart =
    shouldStartEscrowAutomation() && !globalThis.__escrowAutomationStarted;

  if (shouldStart) {
    globalThis.__escrowAutomationStarted = true;
    logAutomationInfo("Starting automation monitor.");
    void runMonitorRefundPolling();
    void runMonitorReconciliation();
    setInterval(() => {
      void runMonitorRefundPolling();
    }, LOG_POLL_INTERVAL_MS);
    setInterval(() => {
      void runMonitorReconciliation();
    }, RECONCILIATION_INTERVAL_MS);
  }
}

function createCompletedStepResult(
  step: EscrowAutomationStepName
): EscrowAutomationStepResult {
  return {
    status: "completed",
    step,
  };
}

function createFailedStepResult(
  step: EscrowAutomationStepName,
  error: unknown
): EscrowAutomationStepResult {
  return {
    errorMessage: getAutomationErrorMessage(error),
    status: "failed",
    step,
  };
}

function isCompletedStepResult(result: EscrowAutomationStepResult): boolean {
  return result.status === "completed";
}

function getAutomationErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return errorMessage;
}
