describe("instrumentation.register", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalAutomationFlag = process.env.ENABLE_ESCROW_AUTOMATION;
  const originalNextRuntime = process.env.NEXT_RUNTIME;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    environment.ENABLE_ESCROW_AUTOMATION = originalAutomationFlag;
    environment.NEXT_RUNTIME = originalNextRuntime;
    jest.restoreAllMocks();
  });

  it("does nothing when the runtime is not nodejs", async () => {
    environment.ENABLE_ESCROW_AUTOMATION = "true";
    environment.NEXT_RUNTIME = "edge";
    const mockStartEscrowAutomationMonitor = jest.fn();

    jest.doMock("@/features/escrows/server/escrowAutomationMonitor", () => ({
      startEscrowAutomationMonitor: (...args: unknown[]) =>
        mockStartEscrowAutomationMonitor(...args),
    }));

    const { register } = await import("@/instrumentation");

    await register();

    expect(mockStartEscrowAutomationMonitor).not.toHaveBeenCalled();
  });

  it("does nothing when automation is not enabled", async () => {
    environment.ENABLE_ESCROW_AUTOMATION = undefined;
    environment.NEXT_RUNTIME = "nodejs";
    const mockStartEscrowAutomationMonitor = jest.fn();

    jest.doMock("@/features/escrows/server/escrowAutomationMonitor", () => ({
      startEscrowAutomationMonitor: (...args: unknown[]) =>
        mockStartEscrowAutomationMonitor(...args),
    }));

    const { register } = await import("@/instrumentation");

    await register();

    expect(mockStartEscrowAutomationMonitor).not.toHaveBeenCalled();
  });

  it("starts automation when the node runtime and env flag are both enabled", async () => {
    environment.ENABLE_ESCROW_AUTOMATION = "true";
    environment.NEXT_RUNTIME = "nodejs";
    const mockStartEscrowAutomationMonitor = jest.fn();

    jest.doMock("@/features/escrows/server/escrowAutomationMonitor", () => ({
      startEscrowAutomationMonitor: (...args: unknown[]) =>
        mockStartEscrowAutomationMonitor(...args),
    }));

    const { register } = await import("@/instrumentation");

    await register();

    expect(mockStartEscrowAutomationMonitor).toHaveBeenCalledTimes(1);
  });
});
