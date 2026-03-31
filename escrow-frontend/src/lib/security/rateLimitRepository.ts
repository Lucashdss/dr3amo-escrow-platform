import type { RowDataPacket } from "mysql2";
import type { ResultSetHeader } from "mysql2";

import pool from "@/lib/db";

export type RateLimitCounterInput = {
  identifier: string;
  now: Date;
  scope: string;
  windowStart: Date;
};

type RateLimitCounterRow = RowDataPacket & {
  count: number;
};

async function insertOrIncrementCounter(
  input: RateLimitCounterInput
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO rate_limit_counters (
      scope,
      identifier,
      window_start,
      count,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, 1, ?, ?)
    ON DUPLICATE KEY UPDATE
      count = count + 1,
      updated_at = VALUES(updated_at)`,
    [
      input.scope,
      input.identifier,
      input.windowStart,
      input.now,
      input.now,
    ]
  );
}

async function readCounter(
  input: RateLimitCounterInput
): Promise<RateLimitCounterRow | null> {
  const [rows] = await pool.execute<RateLimitCounterRow[]>(
    `SELECT count
    FROM rate_limit_counters
    WHERE scope = ? AND identifier = ? AND window_start = ?`,
    [input.scope, input.identifier, input.windowStart]
  );

  return rows[0] ?? null;
}

export async function incrementRateLimitCounter(
  input: RateLimitCounterInput
): Promise<number> {
  await insertOrIncrementCounter(input);
  const counter = await readCounter(input);

  return counter?.count ?? 0;
}
