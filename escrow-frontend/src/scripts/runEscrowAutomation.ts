import { closeDatabasePool } from "@/lib/db";
import {
  runEscrowAutomationOnce,
  type EscrowAutomationRunResult,
} from "@/features/escrows/server/escrowAutomationMonitor";

const FAILURE_EXIT_CODE = 1;

export async function runEscrowAutomationScript(): Promise<void> {
  const result = await runAutomationSafely();

  logRunResult(result);
  updateProcessExitCode(result.success);
  await closeDatabasePoolSafely();
}

async function runAutomationSafely(): Promise<EscrowAutomationRunResult> {
  let result: EscrowAutomationRunResult;

  try {
    result = await runEscrowAutomationOnce();
  } catch (error) {
    result = createFailedRunResult(error);
    console.error("[escrow-automation] Cron run failed unexpectedly.", error);
  }

  return result;
}

function logRunResult(result: EscrowAutomationRunResult): void {
  console.info("[escrow-automation] Cron run completed.", result);
}

function updateProcessExitCode(success: boolean): void {
  if (!success) {
    process.exitCode = FAILURE_EXIT_CODE;
  }
}

async function closeDatabasePoolSafely(): Promise<void> {
  try {
    await closeDatabasePool();
  } catch (error) {
    process.exitCode = FAILURE_EXIT_CODE;
    console.error("[escrow-automation] Failed to close database pool.", error);
  }
}

function createFailedRunResult(error: unknown): EscrowAutomationRunResult {
  const errorMessage = getErrorMessage(error);

  return {
    steps: [
      { errorMessage, status: "failed", step: "refundPolling" },
      { errorMessage, status: "failed", step: "reconciliation" },
    ],
    success: false,
  };
}

function getErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return errorMessage;
}

if (process.env.NODE_ENV !== "test") {
  void runEscrowAutomationScript();
}
