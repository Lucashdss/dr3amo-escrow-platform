import {
  createClientKpis,
  createFreelancerKpis,
} from "@/features/dashboard/data/dashboardData";

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
