import type { Address } from "viem";

import type { EscrowChainKey } from "@/features/escrows/types/escrow";

type SupportedChainId = 8453 | 84532;

export const FACTORY_BASE_ADDRESS =
  "0x535C8F9906A090766F914A60Fef3e85B2A37Bf15";
export const FACTORY_BASE_SEPOLIA_ADDRESS =
  "0x535C8F9906A090766F914A60Fef3e85B2A37Bf15";
export const FACTORY_ADMIN_ADDRESS =
  "0x2ecc13cbf4330c4134672455FA52298Ba89bC893";

export const BASE_MAINNET_DATA_FEED_ADDRESS =
  "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
export const BASE_SEPOLIA_DATA_FEED_ADDRESS =
  "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";

export const BASE_MAINNET_USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_SEPOLIA_USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const ETH_ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export type EscrowDeploymentConfig = {
  chainId: SupportedChainId;
  factoryAddress: Address;
  dataFeedAddress: Address;
  displayName: string;
  usdcAddress: Address;
};

export const ESCROW_DEPLOYMENT_CONFIGS: Record<
  EscrowChainKey,
  EscrowDeploymentConfig
> = {
  base: {
    chainId: 8453,
    factoryAddress: FACTORY_BASE_ADDRESS,
    dataFeedAddress: BASE_MAINNET_DATA_FEED_ADDRESS,
    displayName: "Base Mainnet",
    usdcAddress: BASE_MAINNET_USDC_ADDRESS,
  },
  baseSepolia: {
    chainId: 84532,
    factoryAddress: FACTORY_BASE_SEPOLIA_ADDRESS,
    dataFeedAddress: BASE_SEPOLIA_DATA_FEED_ADDRESS,
    displayName: "Base Sepolia",
    usdcAddress: BASE_SEPOLIA_USDC_ADDRESS,
  },
};
