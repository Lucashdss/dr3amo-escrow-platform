import {
  deriveEscrowActionAvailability,
  parseFundAmount,
  parseMinimumPriceUsdAmount,
  parseModificationExtensionDays,
  validateEscrowActionInput,
} from "@/features/escrows/services/escrowActions";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
  const environment = process.env as Record<string, string | undefined>;

  environment.NODE_ENV = value;
}

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
  tokenAddress: "0x0000000000000000000000000000000000000020",
  tokenId: 3,
};

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

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

  it("disables dispute in production with the development message", () => {
    setNodeEnv("production");

    const actions = deriveEscrowActionAvailability({
      escrow: { ...baseEscrow, state: "funded" },
      liveEscrowState: "funded",
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(actions.find((action) => action.key === "initiateDispute")).toMatchObject({
      disabled: true,
      disabledReason: "on development",
    });
  });

  it("keeps dispute available outside production for non-terminal states", () => {
    setNodeEnv("development");

    const actions = deriveEscrowActionAvailability({
      escrow: { ...baseEscrow, state: "funded" },
      liveEscrowState: "funded",
      liveSnapshot: {
        minimumPriceUsd: "0",
        modificationsRequested: 0,
      },
    });

    expect(actions.find((action) => action.key === "initiateDispute")).toMatchObject({
      disabled: false,
      disabledReason: null,
    });
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

  it("rejects funding amounts above the token maximum", () => {
    expect(
      validateEscrowActionInput({
        action: "fund",
        amount: "1000.000001",
        deadlineExtensionDays: "",
        tokenId: 3,
        usdAmount: "",
      })
    ).toEqual({
      success: false,
      error: "Funding amount exceeds the allowed maximum.",
    });
  });

  it("rejects minimum prices above the allowed maximum", () => {
    expect(
      validateEscrowActionInput({
        action: "setMinimumPriceUSD",
        amount: "",
        deadlineExtensionDays: "",
        tokenId: 3,
        usdAmount: "1000001",
      })
    ).toEqual({
      success: false,
      error: "Minimum price exceeds the allowed maximum.",
    });
  });

  it("rejects extension days above 183", () => {
    expect(
      validateEscrowActionInput({
        action: "requestModificationAndUpdateDeadline",
        amount: "",
        deadlineExtensionDays: "184",
        tokenId: 3,
        usdAmount: "",
      })
    ).toEqual({
      success: false,
      error: "Deadline extension exceeds the allowed maximum.",
    });
  });
});
