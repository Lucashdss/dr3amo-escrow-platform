import { create } from "zustand";

type WalletStore = {
  account: string | null;
  setAccount: (account: string | null) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
}));
