import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "@/lib/db";
import type {
  ClientEscrowStateGroups,
  ClientEscrowSummaryResult,
  EscrowManagementItem,
  EscrowRecord,
  FreelancerEscrowStateGroups,
  FreelancerEscrowSummaryResult,
} from "@/features/escrows/types/escrow";

type EscrowRow = EscrowRecord & RowDataPacket;
type EscrowManagementRow = RowDataPacket & {
  id: number;
  amount: string;
  chainId: number;
  clientId: number;
  clientUsername: string | null;
  contractAddress: string;
  createdAt: string;
  deadline: string;
  escrowName: string;
  freelancerId: number;
  freelancerUsername: string | null;
  modificationsRequested: number | null;
  state: string;
  tokenAddress: string | null;
  tokenId: number;
};
type ClientEscrowSummaryRow = RowDataPacket & {
  activeContractsCount: number;
  deadlinesApproachingCount: number;
  completedContractsCount: number;
  ethAmount: number | string;
  pendingReviewsCount: number;
  totalAmount: number | string;
  usdcAmount: number | string;
};
type FreelancerEscrowSummaryRow = RowDataPacket & {
  activeContractsCount: number;
  completedContractsCount: number;
  deadlinesApproachingCount: number;
  ethAmount: number | string;
  totalAmount: number | string;
  usdcAmount: number | string;
  waitingDeliveriesCount: number;
};

export type CreateEscrowRecordInput = {
  amount: string;
  chainId: number;
  clientId: number;
  contractAddress: string;
  deadline: string;
  escrowName: string;
  freelancerId: number;
  modificationsRequested: number;
  state: string;
  tokenId: number;
};

export type UpdateEscrowSnapshotInput = {
  amount: string;
  deadline: string;
  id: number;
  modificationsRequested: number;
  state: string;
};

const ESCROW_SELECT_FIELDS =
  "id, contract_address, escrow_name, client_id, freelancer_id, token_id, chain_id, amount, `ModificationsRequested` AS modifications_requested, deadline, state, created_at";
const MANAGEMENT_SELECT_FIELDS = `escrows.id AS id,
  escrows.amount AS amount,
  escrows.chain_id AS chainId,
  escrows.client_id AS clientId,
  client_user.username AS clientUsername,
  escrows.contract_address AS contractAddress,
  escrows.created_at AS createdAt,
  escrows.deadline AS deadline,
  escrows.escrow_name AS escrowName,
  escrows.freelancer_id AS freelancerId,
  freelancer_user.username AS freelancerUsername,
  escrows.\`ModificationsRequested\` AS modificationsRequested,
  escrows.state AS state,
  token_record.token_address AS tokenAddress,
  escrows.token_id AS tokenId`;

async function queryEscrows(
  sql: string,
  values: readonly unknown[] = []
): Promise<EscrowRecord[]> {
  const [rows] = await pool.query<EscrowRow[]>(sql, values);
  return rows;
}

function getEscrowRole(
  clientId: number,
  freelancerId: number,
  userId: number
): EscrowManagementItem["role"] {
  return clientId === userId ? "client" : "freelancer";
}

function mapManagementRow(
  row: EscrowManagementRow,
  userId: number
): EscrowManagementItem {
  return {
    amount: row.amount,
    chainId: row.chainId,
    clientUsername: row.clientUsername ?? "Unknown client",
    contractAddress: row.contractAddress,
    createdAt: row.createdAt,
    deadline: row.deadline,
    escrowName: row.escrowName,
    freelancerUsername: row.freelancerUsername ?? "Unknown freelancer",
    id: row.id,
    modificationsRequested: row.modificationsRequested ?? 0,
    role: getEscrowRole(row.clientId, row.freelancerId, userId),
    state: row.state,
    tokenAddress: row.tokenAddress ?? "",
    tokenId: row.tokenId,
  };
}

async function queryManagementEscrows(
  sql: string,
  values: readonly unknown[],
  userId: number
): Promise<EscrowManagementItem[]> {
  const [rows] = await pool.query<EscrowManagementRow[]>(sql, values);
  return rows.map((row) => mapManagementRow(row, userId));
}

export async function listEscrows(): Promise<EscrowRecord[]> {
  return queryEscrows(`SELECT ${ESCROW_SELECT_FIELDS} FROM escrows ORDER BY created_at DESC`);
}

export async function listEscrowsForUser(
  userId: number
): Promise<EscrowManagementItem[]> {
  return queryManagementEscrows(
    `SELECT ${MANAGEMENT_SELECT_FIELDS}
     FROM escrows
     LEFT JOIN users AS client_user ON client_user.id = escrows.client_id
     LEFT JOIN users AS freelancer_user ON freelancer_user.id = escrows.freelancer_id
     LEFT JOIN tokens AS token_record ON token_record.id = escrows.token_id
     WHERE escrows.client_id = ? OR escrows.freelancer_id = ?
     ORDER BY escrows.created_at DESC`,
    [userId, userId],
    userId
  );
}

export async function createEscrowRecord(
  input: CreateEscrowRecordInput
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO escrows (contract_address, escrow_name, client_id, freelancer_id, token_id, chain_id, amount, `ModificationsRequested`, deadline, state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [
      input.contractAddress,
      input.escrowName,
      input.clientId,
      input.freelancerId,
      input.tokenId,
      input.chainId,
      input.amount,
      input.modificationsRequested,
      input.deadline,
      input.state,
    ]
  );

  return result.insertId;
}

export async function findEscrowById(id: number): Promise<EscrowRecord | null> {
  const escrows = await queryEscrows(
    `SELECT ${ESCROW_SELECT_FIELDS} FROM escrows WHERE id = ? LIMIT 1`,
    [id]
  );

  return escrows[0] ?? null;
}

export async function updateEscrowSnapshot(
  input: UpdateEscrowSnapshotInput
): Promise<void> {
  await pool.query<ResultSetHeader>(
    "UPDATE escrows SET amount = ?, deadline = ?, state = ?, `ModificationsRequested` = ? WHERE id = ?",
    [
      input.amount,
      input.deadline,
      input.state,
      input.modificationsRequested,
      input.id,
    ]
  );
}

export async function findEscrowManagementByIdForUser(
  id: number,
  userId: number
): Promise<EscrowManagementItem | null> {
  const escrows = await queryManagementEscrows(
    `SELECT ${MANAGEMENT_SELECT_FIELDS}
     FROM escrows
     LEFT JOIN users AS client_user ON client_user.id = escrows.client_id
     LEFT JOIN users AS freelancer_user ON freelancer_user.id = escrows.freelancer_id
     LEFT JOIN tokens AS token_record ON token_record.id = escrows.token_id
     WHERE escrows.id = ?
       AND (escrows.client_id = ? OR escrows.freelancer_id = ?)
     LIMIT 1`,
    [id, userId, userId],
    userId
  );

  return escrows[0] ?? null;
}

function createStatePlaceholders(states: readonly string[]): string {
  return states.map(() => "?").join(", ");
}

function normalizeAmountTotal(value: number | string): string {
  const normalizedValue = typeof value === "number" ? value.toString() : value;

  if (!normalizedValue.includes(".")) {
    return normalizedValue;
  }

  return normalizedValue.replace(/\.?0+$/, "") || "0";
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
                    THEN CAST(amount AS DECIMAL(36, 18))
                  ELSE 0
                END
              ),
              0
            ) AS totalAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${activeStatePlaceholders})
                    AND token_id IN (1, 2) THEN CAST(amount AS DECIMAL(36, 6))
                  ELSE 0
                END
              ),
              0
            ) AS usdcAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${activeStatePlaceholders})
                    AND token_id = 3 THEN CAST(amount AS DECIMAL(36, 18))
                  ELSE 0
                END
              ),
              0
            ) AS ethAmount
     FROM escrows
     WHERE client_id = ?`,
    [
      ...stateGroups.completed,
      ...stateGroups.pendingReview,
      ...stateGroups.activeExcluded,
      ...stateGroups.activeExcluded,
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
    ethAmount: normalizeAmountTotal(rows[0]?.ethAmount ?? "0"),
    pendingReviewsCount: rows[0]?.pendingReviewsCount ?? 0,
    totalAmount: normalizeAmountTotal(rows[0]?.totalAmount ?? "0"),
    usdcAmount: normalizeAmountTotal(rows[0]?.usdcAmount ?? "0"),
  };
}

export async function getFreelancerEscrowSummary(
  freelancerId: number,
  stateGroups: FreelancerEscrowStateGroups
): Promise<FreelancerEscrowSummaryResult> {
  const completedStatePlaceholders = createStatePlaceholders(
    stateGroups.completed
  );
  const deadlinesStatePlaceholders = createStatePlaceholders(
    stateGroups.deadlinesExcluded
  );
  const receivableStatePlaceholders = createStatePlaceholders(
    stateGroups.receivableExcluded
  );
  const waitingDeliveryStatePlaceholders = createStatePlaceholders(
    stateGroups.waitingDeliveryExcluded
  );
  const [rows] = await pool.query<FreelancerEscrowSummaryRow[]>(
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
                  WHEN LOWER(state) NOT IN (${receivableStatePlaceholders})
                    THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS activeContractsCount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${deadlinesStatePlaceholders})
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
                  WHEN LOWER(state) NOT IN (${waitingDeliveryStatePlaceholders})
                    THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS waitingDeliveriesCount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${receivableStatePlaceholders})
                    THEN CAST(amount AS DECIMAL(36, 18))
                  ELSE 0
                END
              ),
              0
            ) AS totalAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${receivableStatePlaceholders})
                    AND token_id IN (1, 2) THEN CAST(amount AS DECIMAL(36, 6))
                  ELSE 0
                END
              ),
              0
            ) AS usdcAmount,
            COALESCE(
              SUM(
                CASE
                  WHEN LOWER(state) NOT IN (${receivableStatePlaceholders})
                    AND token_id = 3 THEN CAST(amount AS DECIMAL(36, 18))
                  ELSE 0
                END
              ),
              0
            ) AS ethAmount
     FROM escrows
     WHERE freelancer_id = ?`,
    [
      ...stateGroups.completed,
      ...stateGroups.receivableExcluded,
      ...stateGroups.deadlinesExcluded,
      ...stateGroups.waitingDeliveryExcluded,
      ...stateGroups.receivableExcluded,
      ...stateGroups.receivableExcluded,
      ...stateGroups.receivableExcluded,
      freelancerId,
    ]
  );

  return {
    activeContractsCount: rows[0]?.activeContractsCount ?? 0,
    completedContractsCount: rows[0]?.completedContractsCount ?? 0,
    deadlinesApproachingCount: rows[0]?.deadlinesApproachingCount ?? 0,
    ethAmount: normalizeAmountTotal(rows[0]?.ethAmount ?? "0"),
    totalAmount: normalizeAmountTotal(rows[0]?.totalAmount ?? "0"),
    usdcAmount: normalizeAmountTotal(rows[0]?.usdcAmount ?? "0"),
    waitingDeliveriesCount: rows[0]?.waitingDeliveriesCount ?? 0,
  };
}
