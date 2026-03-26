import {
  createDashboardActivity,
  createClientKpis,
  createFreelancerKpis,
} from "@/features/dashboard/data/dashboardData";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

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
});
