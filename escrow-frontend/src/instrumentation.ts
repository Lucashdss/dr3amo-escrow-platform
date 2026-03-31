import { startEscrowAutomationMonitor } from "@/features/escrows/server/escrowAutomationMonitor";

export async function register() {
  startEscrowAutomationMonitor();
}
