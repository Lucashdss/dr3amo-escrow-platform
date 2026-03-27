import type { LandingCodeResponse } from "@/features/landing-code/types/landingCode";

type LandingCodeConfig = {
  fileName: string;
  githubUrl: string;
  rawUrl: string;
  subtitle: string;
  title: string;
};

export const LANDING_CODE_CONFIG: LandingCodeConfig = {
  fileName: "EscrowFreelance.sol",
  githubUrl:
    "https://github.com/Lucashdss/EscrowOracleFreelance/blob/master/src/EscrowFreelance.sol",
  rawUrl:
    "https://raw.githubusercontent.com/Lucashdss/EscrowOracleFreelance/master/src/EscrowFreelance.sol",
  subtitle: "Open and verifiable on-chain escrow logic",
  title: "See what you're interacting with",
};

export function createEmptyLandingCodeResponse(): LandingCodeResponse {
  return {
    fileName: LANDING_CODE_CONFIG.fileName,
    githubUrl: LANDING_CODE_CONFIG.githubUrl,
    lines: [],
    subtitle: LANDING_CODE_CONFIG.subtitle,
    title: LANDING_CODE_CONFIG.title,
  };
}
