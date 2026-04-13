import { getProductionEscrowActionDisabledReason } from "@/features/escrows/config/environment";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
  const environment = process.env as Record<string, string | undefined>;

  environment.NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

describe("getProductionEscrowActionDisabledReason", () => {
  it("blocks dispute submissions in production", () => {
    setNodeEnv("production");

    expect(getProductionEscrowActionDisabledReason("initiateDispute")).toBe(
      "on development"
    );
  });

  it("does not block dispute submissions outside production", () => {
    setNodeEnv("development");

    expect(getProductionEscrowActionDisabledReason("initiateDispute")).toBeNull();
  });

  it("does not block other escrow actions in production", () => {
    setNodeEnv("production");

    expect(getProductionEscrowActionDisabledReason("fund")).toBeNull();
  });
});
