import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Escrow App",
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
    }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
});
