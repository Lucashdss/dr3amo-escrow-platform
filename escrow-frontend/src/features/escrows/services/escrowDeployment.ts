import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import {
  parseEventLogs,
  type Address,
} from "viem";

import { FACTORY_ABI } from "@/features/escrows/config/factoryAbi";
import {
  ESCROW_DEPLOYMENT_CONFIGS,
  FACTORY_ADMIN_ADDRESS,
} from "@/features/escrows/config/deployment";
import { extractEscrowAddressFromLogs } from "@/features/escrows/services/escrowLogDecoder";
import {
  getTokenAddress,
  percentToBps,
} from "@/features/escrows/services/validation";
import type { EscrowChainKey, TokenSymbol } from "@/features/escrows/types/escrow";
import { config } from "@/lib/web3/wagmi";

type DeployEscrowInput = {
  chainKey: EscrowChainKey;
  deliveryDays: number;
  freelancerAddress: Address;
  upfrontPercentage: number;
  tokenSymbol: TokenSymbol;
};

function isFactoryEventLog(log: unknown): log is {
  args: { escrow?: Address };
  eventName: "EscrowCreated";
} {
  if (!log || typeof log !== "object") {
    return false;
  }

  return (
    "args" in log &&
    "eventName" in log &&
    typeof (log as { args?: unknown }).args === "object" &&
    (log as { args?: unknown }).args !== null &&
    (log as { eventName?: string }).eventName === "EscrowCreated"
  );
}

export async function deployEscrow(
  input: DeployEscrowInput
): Promise<{ escrowAddress: Address; txHash: string }> {
  const deploymentConfig = ESCROW_DEPLOYMENT_CONFIGS[input.chainKey];
  const txHash = await writeContract(config, {
    abi: FACTORY_ABI,
    address: deploymentConfig.factoryAddress,
    args: [
      input.freelancerAddress,
      BigInt(input.deliveryDays),
      deploymentConfig.dataFeedAddress,
      getTokenAddress(input.tokenSymbol, input.chainKey),
      FACTORY_ADMIN_ADDRESS,
      BigInt(percentToBps(input.upfrontPercentage)),
    ],
    chainId: deploymentConfig.chainId,
    functionName: "createEscrow",
  });
  const receipt = await waitForTransactionReceipt(config, {
    chainId: deploymentConfig.chainId,
    hash: txHash,
  });
  const parsedFactoryLogs = parseEventLogs({
    abi: FACTORY_ABI,
    eventName: "EscrowCreated",
    logs: receipt.logs,
    strict: false,
  });
  const escrowCreatedLog = parsedFactoryLogs.find(isFactoryEventLog);
  const escrowAddress =
    escrowCreatedLog?.args?.escrow ?? extractEscrowAddressFromLogs(receipt.logs);

  if (!escrowAddress) {
    throw new Error(
      "The transaction was confirmed, but the factory event could not be decoded."
    );
  }

  return {
    escrowAddress,
    txHash,
  };
}
