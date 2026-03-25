import {
  deriveEscrowActionAvailability,
  parseFundAmount,
  parseMinimumPriceUsdAmount,
  parseModificationExtensionDays,
} from "@/features/escrows/services/escrowActions";

const baseEscrow = {
  id: 7,
  amount: "0",
  chainId: 1,
  clientUsername: "client",
  contractAddress: "0x0000000000000000000000000000000000000010",
  createdAt: "2026-03-16T00:00:00.000Z",
  deadline: "2026-03-20",
  escrowName: "Landing page refresh",
  freelancerUsername: "freelancer",
  role: "client" as const,
  state: "created",
  tokenId: 3,
};

describe("deriveEscrowActionAvailability", () => {
  it("returns the client action set", () => {
    const actions = deriveEscrowActionAvailability({
      escrow: baseEscrow,
      liveEscrowState: null,
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(actions.map((action) => action.key)).toEqual([
      "cancelEscrow",
      "fund",
      "confirmDelivery",
      "requestModificationAndUpdateDeadline",
      "initiateDispute",
    ]);
  });

  it("enables cancelEscrow only while the escrow is still created", () => {
    const createdActions = deriveEscrowActionAvailability({
      escrow: baseEscrow,
      liveEscrowState: "created",
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });
    const fundedActions = deriveEscrowActionAvailability({
      escrow: baseEscrow,
      liveEscrowState: "funded",
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(
      createdActions.find((action) => action.key === "cancelEscrow")
    ).toMatchObject({ disabled: false });
    expect(
      fundedActions.find((action) => action.key === "cancelEscrow")
    ).toMatchObject({ disabled: true });
  });

  it("disables fund only for terminal live states", () => {
    const actions = deriveEscrowActionAvailability({
      escrow: baseEscrow,
      liveEscrowState: "released",
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(actions.find((action) => action.key === "fund")).toMatchObject({
      disabled: true,
    });
  });

  it("enables markWorkSubmitted for funded and pending modification states", () => {
    const fundedActions = deriveEscrowActionAvailability({
      escrow: { ...baseEscrow, role: "freelancer", state: "funded" },
      liveEscrowState: null,
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });
    const pendingModificationActions = deriveEscrowActionAvailability({
      escrow: { ...baseEscrow, role: "freelancer", state: "pending modification" },
      liveEscrowState: null,
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(
      fundedActions.find((action) => action.key === "markWorkSubmitted")
    ).toMatchObject({ disabled: false });
    expect(
      pendingModificationActions.find(
        (action) => action.key === "markWorkSubmitted"
      )
    ).toMatchObject({ disabled: false });
  });

  it("disables modification requests once the maximum is reached", () => {
    const actions = deriveEscrowActionAvailability({
      escrow: { ...baseEscrow, state: "work submitted" },
      liveEscrowState: null,
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 2,
      },
    });

    expect(
      actions.find(
        (action) => action.key === "requestModificationAndUpdateDeadline"
      )
    ).toMatchObject({ disabled: true });
  });
});

describe("escrow action input parsing", () => {
  it("parses ETH funding amounts with 18 decimals", () => {
    expect(parseFundAmount("1.5", 3)).toBe(BigInt("1500000000000000000"));
  });

  it("parses USDC funding amounts with 6 decimals", () => {
    expect(parseFundAmount("1.5", 1)).toBe(BigInt("1500000"));
  });

  it("parses whole-number minimum USD amounts", () => {
    expect(parseMinimumPriceUsdAmount("1000")).toBe(BigInt(1000));
    expect(parseMinimumPriceUsdAmount("10.5")).toBeNull();
  });

  it("parses whole-number modification extension days", () => {
    expect(parseModificationExtensionDays("3")).toBe(BigInt(3));
    expect(parseModificationExtensionDays("0")).toBeNull();
  });
});
