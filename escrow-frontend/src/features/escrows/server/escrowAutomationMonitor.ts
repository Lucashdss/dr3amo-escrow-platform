import "server-only";

import { isEscrowAutomationEnabled } from "@/lib/env/server";
import {
  getLatestEscrowBlockNumber,
  listRefundCandidates,
} from "@/features/escrows/services/escrowContract";

import {
  listActiveEscrowMonitoringTargets,
  reconcileActiveEscrows,
  syncAutomatedRefundEscrow,
} from "./escrowService";
import {
  findMonitorStateByChainId,
  upsertMonitorState,
} from "./escrowRepository";

const LOG_POLL_INTERVAL_MS = 30_000;
const MAX_REFUND_SYNC_RETRIES = 2;
const MAX_PROCESSED_KEYS = 1000;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;

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
): Promise<void> {
  const latestBlock = await getLatestEscrowBlockNumber(chainId);
  const monitorState = await findMonitorStateByChainId(chainId);
  const storedBlock = monitorState?.lastProcessedBlock;

  if (storedBlock === undefined) {
    await upsertMonitorState(chainId, latestBlock);
    logAutomationInfo("Seeded monitor cursor.", {
      chainId,
      latestBlock: latestBlock.toString(),
    });
    return;
  }

  if (latestBlock <= storedBlock) {
    return;
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
    return;
  }

  await upsertMonitorState(chainId, latestBlock);
}

async function pollRefundCandidates(): Promise<void> {
  try {
    const targets = await listActiveEscrowMonitoringTargets();
    const groupedTargets = groupTargetsByChain(targets);

    for (const [chainId, contractAddresses] of groupedTargets) {
      await processRefundCandidatesForChain(chainId, contractAddresses);
    }
  } catch (error) {
    logAutomationError("Refund polling failed.", error);
  }
}

async function runReconciliation(): Promise<void> {
  try {
    const updatedCount = await reconcileActiveEscrows();

    logAutomationInfo("Reconciliation completed.", { updatedCount });
  } catch (error) {
    logAutomationError("Reconciliation failed.", error);
  }
}

export function startEscrowAutomationMonitor(): void {
  const shouldStart =
    shouldStartEscrowAutomation() && !globalThis.__escrowAutomationStarted;

  if (shouldStart) {
    globalThis.__escrowAutomationStarted = true;
    logAutomationInfo("Starting automation monitor.");
    void pollRefundCandidates();
    void runReconciliation();
    setInterval(() => {
      void pollRefundCandidates();
    }, LOG_POLL_INTERVAL_MS);
    setInterval(() => {
      void runReconciliation();
    }, RECONCILIATION_INTERVAL_MS);
  }
}
