import type { EscrowActionKey } from "@/features/escrows/types/escrow";

const DISPUTE_DEVELOPMENT_MESSAGE = "on development";

function isEscrowProductionEnvironment(): boolean {
  const isProductionEnvironment = process.env.NODE_ENV === "production";

  return isProductionEnvironment;
}

export function getProductionEscrowActionDisabledReason(
  actionKey: EscrowActionKey
): string | null {
  const isDisputeAction = actionKey === "initiateDispute";
  let disabledReason: string | null = null;

  if (isEscrowProductionEnvironment() && isDisputeAction) {
    disabledReason = DISPUTE_DEVELOPMENT_MESSAGE;
  }

  return disabledReason;
}
