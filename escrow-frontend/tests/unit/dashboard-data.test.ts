import fc from "fast-check";

import {
  createDashboardActivity,
  createClientKpis,
  createFreelancerKpis,
} from "@/features/dashboard/data/dashboardData";
import type { KpiValueOptions } from "@/features/dashboard/types/dashboard";
import {
  ESCROW_LIVE_STATES,
  type EscrowManagementItem,
} from "@/features/escrows/types/escrow";

type GeneratedEscrowInput = Readonly<{
  state: string;
  timestampOffsetHours: number;
  usesChangedAt: boolean;
}>;

const amountTextArbitrary: fc.Arbitrary<string> = fc
  .integer({ max: 1_000_000, min: 0 })
  .map((amount) => `${amount}.00`);

const countTextArbitrary: fc.Arbitrary<string> = fc
  .integer({ max: 10_000, min: 0 })
  .map(String);

const kpiValueOptionsArbitrary: fc.Arbitrary<KpiValueOptions> = fc.record({
  ETH: amountTextArbitrary,
  USDC: amountTextArbitrary,
});

const generatedEscrowInputArbitrary: fc.Arbitrary<GeneratedEscrowInput> =
  fc.record({
    state: fc.constantFrom(...ESCROW_LIVE_STATES),
    timestampOffsetHours: fc.integer({ max: 10_000, min: 0 }),
    usesChangedAt: fc.boolean(),
  });

const activityEscrowsArbitrary: fc.Arbitrary<EscrowManagementItem[]> =
  fc.uniqueArray(generatedEscrowInputArbitrary, {
    maxLength: 12,
    selector: (input) => input.timestampOffsetHours,
  }).map(createGeneratedEscrows);

function createEscrow(
  id: number,
  state: string,
  changedAt: string | null = null
): EscrowManagementItem {
  return {
    amount: "100.00",
    chainId: 1,
    changedAt,
    clientUsername: "buyer",
    contractAddress: `0x${id.toString(16).padStart(40, "0")}`,
    createdAt: "2026-03-20T10:00:00.000Z",
    deadline: "2026-03-30",
    escrowName: `Escrow ${id}`,
    freelancerUsername: "seller",
    id,
    role: "client",
    state,
    tokenAddress: "0x0000000000000000000000000000000000000001",
    tokenId: 1,
  };
}

function createGeneratedEscrows(
  inputs: GeneratedEscrowInput[]
): EscrowManagementItem[] {
  return inputs.map(createGeneratedEscrow);
}

function createGeneratedEscrow(
  input: GeneratedEscrowInput,
  index: number
): EscrowManagementItem {
  const id = index + 1;
  const timestamp = createTimestamp(input.timestampOffsetHours);

  return {
    ...createEscrow(id, input.state, input.usesChangedAt ? timestamp : null),
    createdAt: timestamp,
  };
}

function createTimestamp(offsetHours: number): string {
  const time = Date.UTC(2026, 2, 20, offsetHours);

  return new Date(time).toISOString();
}

function getEscrowTimestamp(escrow: EscrowManagementItem): number {
  const value = escrow.changedAt ?? escrow.createdAt;

  return Date.parse(value);
}

function getExpectedActivityNames(escrows: EscrowManagementItem[]): string[] {
  return [...escrows]
    .sort((leftEscrow, rightEscrow) => {
      return getEscrowTimestamp(rightEscrow) - getEscrowTimestamp(leftEscrow);
    })
    .slice(0, 5)
    .map((escrow) => escrow.escrowName);
}

function getActivityEscrowNames(
  items: ReturnType<typeof createDashboardActivity>
): string[] {
  return items.map((item) => item.detail.split(" moved to ")[0] ?? "");
}

describe("dashboard KPI factories", () => {
  it("returns client KPI items without a change property", () => {
    const items = createClientKpis(
      { ETH: "1.00", USDC: "100.00" },
      "2",
      "3",
      "4",
      "5",
    );

    expect(items).toHaveLength(5);
    expect(items[0]).not.toHaveProperty("change");
  });

  it("preserves generated client KPI values", () => {
    fc.assert(
      fc.property(
        kpiValueOptionsArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        (fundsInEscrows, active, completed, pending, deadlines) => {
          const items = createClientKpis(
            fundsInEscrows,
            active,
            completed,
            pending,
            deadlines
          );

          expect(items).toHaveLength(5);
          expect(items[0]?.value).toBe(fundsInEscrows.USDC);
          expect(items[0]?.valueOptions).toBe(fundsInEscrows);
          expect(items[0]).not.toHaveProperty("change");
        }
      )
    );
  });

  it("returns freelancer KPI items without a change property", () => {
    const items = createFreelancerKpis(
      { ETH: "1.00", USDC: "100.00" },
      "2",
      "3",
      "4",
      "5",
    );

    expect(items).toHaveLength(5);
    expect(items[0]).not.toHaveProperty("change");
  });

  it("preserves generated freelancer KPI values", () => {
    fc.assert(
      fc.property(
        kpiValueOptionsArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        countTextArbitrary,
        (fundsToReceive, active, waiting, deadlines, completed) => {
          const items = createFreelancerKpis(
            fundsToReceive,
            active,
            waiting,
            deadlines,
            completed
          );

          expect(items).toHaveLength(5);
          expect(items[0]?.value).toBe(fundsToReceive.USDC);
          expect(items[0]?.valueOptions).toBe(fundsToReceive);
          expect(items[0]).not.toHaveProperty("change");
        }
      )
    );
  });
});

describe("createDashboardActivity", () => {
  it("returns the five most recent escrow changes", () => {
    const items = createDashboardActivity([
      createEscrow(1, "created", "2026-03-20T10:00:00.000Z"),
      createEscrow(2, "funded", "2026-03-20T11:00:00.000Z"),
      createEscrow(3, "work submitted", "2026-03-20T12:00:00.000Z"),
      createEscrow(4, "pending modification", "2026-03-20T13:00:00.000Z"),
      createEscrow(5, "released", "2026-03-20T14:00:00.000Z"),
      createEscrow(6, "dispute", "2026-03-20T15:00:00.000Z"),
    ]);

    expect(items).toHaveLength(5);
    expect(items.map((item) => item.title)).toEqual([
      "Dispute",
      "Released",
      "Pending Modification",
      "Work Submitted",
      "Funded",
    ]);
    expect(items[0]?.detail).toContain("Escrow 6 moved to Dispute.");
  });

  it("falls back to the creation time when changedAt is missing", () => {
    const items = createDashboardActivity([
      createEscrow(7, "created"),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Created");
    expect(items[0]?.when).toContain("2026");
  });

  it("orders generated activity by most recent available timestamp", () => {
    fc.assert(
      fc.property(activityEscrowsArbitrary, (escrows) => {
        const items = createDashboardActivity(escrows);

        expect(items).toHaveLength(Math.min(escrows.length, 5));
        expect(getActivityEscrowNames(items)).toEqual(
          getExpectedActivityNames(escrows)
        );
      })
    );
  });
});
