import {
  hasSessionForWallet,
  hasSessionMismatch,
} from "@/features/auth/services/walletSession";

describe("walletSession helpers", () => {
  it("does not report a session when auth session lookup returned nothing", () => {
    expect(
      hasSessionForWallet(
        "0x1234567890AbCdEf1234567890aBcdef12345678",
        null
      )
    ).toBe(false);
  });

  it("matches a wallet session after normalizing the connected address", () => {
    expect(
      hasSessionForWallet(
        "0x1234567890AbCdEf1234567890aBcdef12345678",
        "0x1234567890abcdef1234567890abcdef12345678"
      )
    ).toBe(true);
  });

  it("reports a mismatch when the connected wallet differs from the session", () => {
    expect(
      hasSessionMismatch(
        "0x1234567890AbCdEf1234567890aBcdef12345678",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      )
    ).toBe(true);
  });
});
