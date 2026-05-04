const mockCloseDatabasePool = jest.fn();
const mockRunEscrowAutomationOnce = jest.fn();

jest.mock("@/lib/db", () => ({
  closeDatabasePool: (...args: unknown[]) => mockCloseDatabasePool(...args),
}));

jest.mock("@/features/escrows/server/escrowAutomationMonitor", () => ({
  runEscrowAutomationOnce: (...args: unknown[]) =>
    mockRunEscrowAutomationOnce(...args),
}));

import { runEscrowAutomationScript } from "@/scripts/runEscrowAutomation";

describe("runEscrowAutomationScript", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    process.exitCode = undefined;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    mockCloseDatabasePool.mockResolvedValue(undefined);
    mockRunEscrowAutomationOnce.mockResolvedValue({
      steps: [
        { status: "completed", step: "refundPolling" },
        { status: "completed", step: "reconciliation" },
      ],
      success: true,
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("closes the database pool after a successful run", async () => {
    await runEscrowAutomationScript();

    expect(mockRunEscrowAutomationOnce).toHaveBeenCalledTimes(1);
    expect(mockCloseDatabasePool).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBeUndefined();
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      "[escrow-automation] Cron run completed.",
      expect.objectContaining({ success: true })
    );
  });

  it("sets a failure exit code and closes the database pool when a step fails", async () => {
    mockRunEscrowAutomationOnce.mockResolvedValueOnce({
      steps: [
        {
          errorMessage: "Refund polling has pending retry failures.",
          status: "failed",
          step: "refundPolling",
        },
        { status: "completed", step: "reconciliation" },
      ],
      success: false,
    });

    await runEscrowAutomationScript();

    expect(mockCloseDatabasePool).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBe(1);
  });

  it("sets a failure exit code when closing the database pool fails", async () => {
    mockCloseDatabasePool.mockRejectedValueOnce(new Error("pool close failed"));

    await runEscrowAutomationScript();

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[escrow-automation] Failed to close database pool.",
      expect.any(Error)
    );
  });
});
