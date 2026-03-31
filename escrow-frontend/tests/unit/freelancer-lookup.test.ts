const mockCheckUserByUsername = jest.fn();
const mockCheckUserByWallet = jest.fn();

jest.mock("@/features/auth/services/userApi", () => ({
  checkUserByUsername: (...args: unknown[]) => mockCheckUserByUsername(...args),
  checkUserByWallet: (...args: unknown[]) => mockCheckUserByWallet(...args),
}));

import { resolveFreelancer } from "@/features/escrows/services/freelancerLookup";

describe("resolveFreelancer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves a freelancer from username lookup", async () => {
    mockCheckUserByUsername.mockResolvedValueOnce({
      exists: true,
      user: {
        username: "seller",
        wallet_address: "0x00000000000000000000000000000000000000ab",
      },
    });

    const result = await resolveFreelancer("seller");

    expect(result).toEqual({
      address: "0x00000000000000000000000000000000000000AB",
      user: {
        username: "seller",
        wallet_address: "0x00000000000000000000000000000000000000ab",
      },
    });
  });

  it("resolves a freelancer from wallet lookup", async () => {
    mockCheckUserByWallet.mockResolvedValueOnce({
      exists: true,
      user: {
        username: "seller",
        wallet_address: "0x00000000000000000000000000000000000000ab",
      },
    });

    const result = await resolveFreelancer(
      "0x00000000000000000000000000000000000000ab"
    );

    expect(result).toEqual({
      address: "0x00000000000000000000000000000000000000AB",
      user: {
        username: "seller",
        wallet_address: "0x00000000000000000000000000000000000000ab",
      },
    });
  });

  it("throws the wallet not registered error when lookup returns null", async () => {
    mockCheckUserByWallet.mockResolvedValueOnce({
      exists: false,
      user: null,
    });

    await expect(
      resolveFreelancer("0x00000000000000000000000000000000000000ab")
    ).rejects.toThrow("Seller wallet is not registered in the app.");
  });
});
