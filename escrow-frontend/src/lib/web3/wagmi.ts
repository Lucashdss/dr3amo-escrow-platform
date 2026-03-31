import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";
import { getPublicAppUrl, getWalletConnectProjectId } from "@/lib/env/public";

const isBrowser = typeof window !== "undefined";
const appUrl = getPublicAppUrl();
const walletConnectProjectId = getWalletConnectProjectId();

const createConnectors = (): CreateConnectorFn[] => {
  if (!isBrowser) {
    return [];
  }

  const connectors: CreateConnectorFn[] = [
    metaMask({
      dapp: {
        name: "Dr3amo",
        url: appUrl,
      },
    }),
  ];

  if (walletConnectProjectId) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
      }),
    );
  }

  return connectors;
};

function createWagmiConfig() {
  const wagmiConfig =
    process.env.NODE_ENV === "production"
      ? createConfig({
        chains: [base],
        connectors: createConnectors(),
        ssr: true,
        transports: {
          [base.id]: http(),
        },
      })
      : createConfig({
        chains: [base, baseSepolia],
        connectors: createConnectors(),
        ssr: true,
        transports: {
          [base.id]: http(),
          [baseSepolia.id]: http(),
        },
      });

  return wagmiConfig;
}

export const config = createWagmiConfig();
