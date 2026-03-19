import {
  normalizeUsername,
  normalizeUsernameLookup,
  normalizeWalletAddress,
} from "@/lib/normalizers";

describe("normalizers", () => {
  it("normalizes wallet addresses to lowercase", () => {
    expect(normalizeWalletAddress(" 0xAbC ")).toBe("0xabc");
  });

  it("trims usernames for storage", () => {
    expect(normalizeUsername("  Alice  ")).toBe("Alice");
  });

  it("normalizes usernames for lookups", () => {
    expect(normalizeUsernameLookup("  Alice  ")).toBe("alice");
  });
});
