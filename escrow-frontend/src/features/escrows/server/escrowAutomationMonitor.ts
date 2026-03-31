import "server-only";

import {
  getLatestEscrowBlockNumber,
  listRefundCandidates,
} from "@/features/escrows/services/escrowContract";

import {
  listActiveEscrowMonitoringTargets,
  reconcileActiveEscrows,
  syncAutomatedRefundEscrow,
} from "./escrowService";

const LOG_POLL_INTERVAL_MS = 30_000;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;

declare global {
  // eslint-disable-next-line no-var
  var __escrowAutomationStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __escrowAutomationLastBlocks: Map<number, bigint> | undefined;
  // eslint-disable-next-line no-var
  var __escrowAutomationProcessedKeys: Set<string> | undefined;
}

function shouldStartEscrowAutomation(): boolean {
  return process.env.NODE_ENV !== "test";
}

function createProcessedKey(
  chainId: number,
  txHash: string,
  contractAddress: string
): string {
  return `${chainId}:${txHash}:${contractAddress.toLowerCase()}`;
}

function getLastBlocks(): Map<number, bigint> {
  globalThis.__escrowAutomationLastBlocks ??= new Map<number, bigint>();
  return globalThis.__escrowAutomationLastBlocks;
}

function getProcessedKeys(): Set<string> {
  globalThis.__escrowAutomationProcessedKeys ??= new Set<string>();
  return globalThis.__escrowAutomationProcessedKeys;
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
  const lastBlocks = getLastBlocks();
  const latestBlock = await getLatestEscrowBlockNumber(chainId);
  const fromBlock = lastBlocks.get(chainId);

  if (fromBlock === undefined) {
    lastBlocks.set(chainId, latestBlock);
    return;
  }

  if (latestBlock <= fromBlock) {
    return;
  }

  const candidates = await listRefundCandidates(
    chainId,
    contractAddresses,
    fromBlock + BigInt(1),
    latestBlock
  );

  for (const candidate of candidates) {
    const processedKeys = getProcessedKeys();
    const processedKey = createProcessedKey(
      chainId,
      candidate.txHash,
      candidate.contractAddress
    );

    if (!processedKeys.has(processedKey)) {
      processedKeys.add(processedKey);
      await syncAutomatedRefundEscrow(
        chainId,
        candidate.contractAddress,
        candidate.txHash
      );
    }
  }

  lastBlocks.set(chainId, latestBlock);
}

async function pollRefundCandidates(): Promise<void> {
  const targets = await listActiveEscrowMonitoringTargets();
  const groupedTargets = groupTargetsByChain(targets);

  for (const [chainId, contractAddresses] of groupedTargets) {
    await processRefundCandidatesForChain(chainId, contractAddresses);
  }
}

async function runReconciliation(): Promise<void> {
  await reconcileActiveEscrows();
}

export function startEscrowAutomationMonitor(): void {
  if (!shouldStartEscrowAutomation()) {
    return;
  }

  if (globalThis.__escrowAutomationStarted) {
    return;
  }

  globalThis.__escrowAutomationStarted = true;
  void pollRefundCandidates();
  void runReconciliation();
  setInterval(() => {
    void pollRefundCandidates();
  }, LOG_POLL_INTERVAL_MS);
  setInterval(() => {
    void runReconciliation();
  }, RECONCILIATION_INTERVAL_MS);
}
