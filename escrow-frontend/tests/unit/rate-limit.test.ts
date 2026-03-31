import { consumeRateLimit } from "@/lib/security/rateLimit";

type CounterInput = {
  identifier: string;
  now: Date;
  scope: string;
  windowStart: Date;
};

function createDependencies(now: () => Date) {
  const store = new Map<string, number>();

  return {
    incrementRateLimitCounter: async (input: CounterInput) => {
      const key = [
        input.scope,
        input.identifier,
        input.windowStart.toISOString(),
      ].join(":");
      const nextCount = (store.get(key) ?? 0) + 1;

      store.set(key, nextCount);
      return nextCount;
    },
    now,
  };
}

describe("consumeRateLimit", () => {
  it("allows requests below the limit", async () => {
    const currentTime = new Date("2026-03-31T10:00:00.000Z");
    const dependencies = createDependencies(() => currentTime);

    const result = await consumeRateLimit(
      { identifier: "203.0.113.1", scope: "message_submit" },
      dependencies
    );

    expect(result).toEqual({
      allowed: true,
      retryAfterSeconds: 600,
    });
  });

  it("blocks requests above the limit", async () => {
    const currentTime = new Date("2026-03-31T10:00:00.000Z");
    const dependencies = createDependencies(() => currentTime);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await consumeRateLimit(
        { identifier: "203.0.113.1", scope: "message_submit" },
        dependencies
      );
    }

    const result = await consumeRateLimit(
      { identifier: "203.0.113.1", scope: "message_submit" },
      dependencies
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(600);
  });

  it("isolates counters by scope and identifier", async () => {
    const currentTime = new Date("2026-03-31T10:00:00.000Z");
    const dependencies = createDependencies(() => currentTime);

    const firstResult = await consumeRateLimit(
      { identifier: "user:1", scope: "user_lookup" },
      dependencies
    );
    const secondResult = await consumeRateLimit(
      { identifier: "user:2", scope: "user_lookup" },
      dependencies
    );
    const thirdResult = await consumeRateLimit(
      { identifier: "203.0.113.1", scope: "message_submit" },
      dependencies
    );

    expect(firstResult.allowed).toBe(true);
    expect(secondResult.allowed).toBe(true);
    expect(thirdResult.allowed).toBe(true);
  });

  it("rolls counters forward when the fixed window changes", async () => {
    let currentTime = new Date("2026-03-31T10:00:59.000Z");
    const dependencies = createDependencies(() => currentTime);

    await consumeRateLimit(
      { identifier: "user:1", scope: "user_lookup" },
      dependencies
    );
    currentTime = new Date("2026-03-31T10:01:00.000Z");
    const result = await consumeRateLimit(
      { identifier: "user:1", scope: "user_lookup" },
      dependencies
    );

    expect(result).toEqual({
      allowed: true,
      retryAfterSeconds: 60,
    });
  });
});
