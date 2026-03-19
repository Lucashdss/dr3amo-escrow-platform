import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "@/lib/db";
import type {
  ClientEscrowStateGroups,
  ClientEscrowSummaryResult,
  EscrowRecord,
} from "@/features/escrows/types/escrow";

type EscrowRow = EscrowRecord & RowDataPacket;
type ClientEscrowSummaryRow = RowDataPacket & {
  activeContractsCount: number;
  deadlinesApproachingCount: number;
  completedContractsCount: number;
  pendingReviewsCount: number;
  totalAmount: number | string;
};

export type CreateEscrowRecordInput = {
  amount: string;
  chainId: number;
  clientId: number;
  contractAddress: string;
  deadline: string;
  freelancerId: number;
  state: string;
  tokenId: number;
};

async function queryEscrows(
  sql: string,
  values: readonly unknown[] = []
): Promise<EscrowRecord[]> {
  const [rows] = await pool.query<EscrowRow[]>(sql, values);
  return rows;
}

export async function listEscrows(): Promise<EscrowRecord[]> {
  return queryEscrows(
    "SELECT id, contract_address, client_id, freelancer_id, token_id, chain_id, amount, deadline, state, created_at FROM escrows ORDER BY created_at DESC"
  );
}

export async function createEscrowRecord(
  input: CreateEscrowRecordInput
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO escrows (contract_address, client_id, freelancer_id, token_id, chain_id, amount, deadline, state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [
      input.contractAddress,
      input.clientId,
      input.freelancerId,
      input.tokenId,
      input.chainId,
      input.amount,
      input.deadline,
      input.state,
    ]
  );

  return result.insertId;
}

export async function findEscrowById(id: number): Promise<EscrowRecord | null> {
  const escrows = await queryEscrows(
    "SELECT id, contract_address, client_id, freelancer_id, token_id, chain_id, amount, deadline, state, created_at FROM escrows WHERE id = ? LIMIT 1",
    [id]
  );

  return escrows[0] ?? null;
}

function createStatePlaceholders(states: readonly string[]): string {
  return states.map(() => "?").join(", ");
}

function normalizeAmountTotal(value: number | string): string {
  return typeof value === "number" ? value.toString() : value;
}

export async function getClientEscrowSummary(
  clientId: number,
  stateGroups: ClientEscrowStateGroups
): Promise<ClientEscrowSummaryResult> {
  const activeStatePlaceholders = createStatePlaceholders(
    stateGroups.activeExcluded
  );
  const completedStatePlaceholders = createStatePlaceholders(
    stateGroups.completed
  );
  const pendingReviewStatePlaceholders = createStatePlaceholders(
    stateGroups.pendingReview
  );
  const [rows] = await pool.query<ClientEscrowSummaryRow[]>(
    `SELECT COALESCE(
              SUM(
              CASE
                WHEN LOWER(state) IN (${completedStatePlaceholders}) THEN 1
                ELSE 0
              END
            ),
              0
            ) AS completedContractsCount,
            COALESCE(
              SUM(
              CASE
                WHEN LOWER(state) IN (${pendingReviewStatePlaceholders}) THEN 1
                ELSE 0
              END
            ),
              0
            ) AS pendingReviewsCount,
            COALESCE(
              SUM(
              CASE
                WHEN LOWER(state) NOT IN (${activeStatePlaceholders})
                  AND DATE(deadline) BETWEEN CURDATE()
                  AND DATE_ADD(CURDATE(), INTERVAL 2 DAY) THEN 1
                ELSE 0
              END
            ),
              0
            ) AS deadlinesApproachingCount,
            COALESCE(
              SUM(
              CASE
                WHEN LOWER(state) NOT IN (${activeStatePlaceholders}) THEN 1
                ELSE 0
              END
            ),
              0
            ) AS activeContractsCount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${activeStatePlaceholders})
                    THEN CAST(amount AS DECIMAL(18, 8))
                  ELSE 0
                END
              ),
              0
            ) AS totalAmount
     FROM escrows
     WHERE client_id = ?`,
    [
      ...stateGroups.completed,
      ...stateGroups.pendingReview,
      ...stateGroups.activeExcluded,
      ...stateGroups.activeExcluded,
      ...stateGroups.activeExcluded,
      clientId,
    ]
  );

  return {
    activeContractsCount: rows[0]?.activeContractsCount ?? 0,
    deadlinesApproachingCount: rows[0]?.deadlinesApproachingCount ?? 0,
    completedContractsCount: rows[0]?.completedContractsCount ?? 0,
    pendingReviewsCount: rows[0]?.pendingReviewsCount ?? 0,
    totalAmount: normalizeAmountTotal(rows[0]?.totalAmount ?? "0"),
  };
}
