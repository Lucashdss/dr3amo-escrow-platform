import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

const createConnectors = (): CreateConnectorFn[] => {
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

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: createConnectors(),
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
