import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "@/lib/db";
import type { EscrowRecord } from "@/features/escrows/types/escrow";

type EscrowRow = EscrowRecord & RowDataPacket;

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
