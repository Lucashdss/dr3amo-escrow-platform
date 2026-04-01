import { isEscrowAutomationEnabled } from "@/lib/env/server";

function isNodeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "nodejs";
}

async function startAutomationMonitor(): Promise<void> {
  const { startEscrowAutomationMonitor } = await import(
    "@/features/escrows/server/escrowAutomationMonitor"
  );

  startEscrowAutomationMonitor();
}

export async function register() {
  const shouldStartAutomation = isNodeRuntime() && isEscrowAutomationEnabled();

  if (shouldStartAutomation) {
    await startAutomationMonitor();
  }
}
