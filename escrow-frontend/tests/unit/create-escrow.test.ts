import {
  calculateDeliveryDays,
  getTokenAddress,
  parseUpfrontPercentage,
  percentToBps,
} from "@/lib/contracts/createEscrow";

describe("create escrow helpers", () => {
  it("parses whole-number upfront percentages", () => {
    expect(parseUpfrontPercentage("0")).toBe(0);
    expect(parseUpfrontPercentage("20")).toBe(20);
    expect(parseUpfrontPercentage("100")).toBe(100);
  });

  it("rejects invalid upfront percentages", () => {
    expect(parseUpfrontPercentage("")).toBeNull();
    expect(parseUpfrontPercentage("12.5")).toBeNull();
    expect(parseUpfrontPercentage("-1")).toBeNull();
    expect(parseUpfrontPercentage("101")).toBeNull();
  });

  it("converts a percentage to basis points", () => {
    expect(percentToBps(20)).toBe(2000);
    expect(percentToBps(0)).toBe(0);
  });

  it("calculates whole days until the selected deadline", () => {
    const now = new Date("2026-03-16T09:30:00");

    expect(calculateDeliveryDays("2026-03-20", now)).toBe(4);
    expect(calculateDeliveryDays("2026-03-17", now)).toBe(1);
  });

  it("returns zero or null for invalid deadline states", () => {
    const now = new Date("2026-03-16T09:30:00");

    expect(calculateDeliveryDays("2026-03-16", now)).toBe(0);
    expect(calculateDeliveryDays("", now)).toBeNull();
    expect(calculateDeliveryDays("not-a-date", now)).toBeNull();
  });

  it("maps token labels to contract addresses", () => {
    expect(getTokenAddress("ETH", "base")).toBe(
      "0x0000000000000000000000000000000000000000"
    );
    expect(getTokenAddress("USDC", "base")).toBe(
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    );
    expect(getTokenAddress("USDC", "baseSepolia")).toBe(
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    );
  });
});
