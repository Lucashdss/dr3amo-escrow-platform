import { ethers } from "ethers";

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("No injected wallet provider found.");
  }

  return new ethers.BrowserProvider(window.ethereum);
};
