import type { Address } from "viem";

import {
  ESCROW_CHAIN_KEYS,
  type EscrowChainKey,
} from "@/features/escrows/types/escrow";

type SupportedChainId = 8453 | 84532;
const PRODUCTION_CHAIN_KEYS = ["base"] as const;

const FACTORY_BASE_ADDRESS =
  "0x18a9A72FAbB02C99438fd0EF4a3C2aA882AE00E7";
const FACTORY_BASE_SEPOLIA_ADDRESS =
  "0xed19b80f382c4a4f9d0e34b98c0ac13e1e308bdf";
export const FACTORY_ADMIN_ADDRESS =
  "0xeC8Cbe508f1f23b016bD4C439D3Db5D622D7C35e";

const BASE_MAINNET_DATA_FEED_ADDRESS =
  "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
const BASE_SEPOLIA_DATA_FEED_ADDRESS =
  "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";

const BASE_MAINNET_USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_SEPOLIA_USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const ETH_ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

type EscrowDeploymentConfig = {
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

export function getAvailableEscrowChainKeys(): readonly EscrowChainKey[] {
  const chainKeys =
    process.env.NODE_ENV === "production"
      ? PRODUCTION_CHAIN_KEYS
      : ESCROW_CHAIN_KEYS;

  return chainKeys;
}
