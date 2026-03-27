import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    metaMask({
      dapp: {
        name: "Dr3amo",
        url: appUrl,
      },
    }),
    walletConnect({
      projectId: walletConnectProjectId,
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
