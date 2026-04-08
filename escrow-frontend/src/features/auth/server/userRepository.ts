import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool, { type DatabaseQueryValues } from "@/lib/db";
import {
  normalizeUsernameLookup,
  normalizeWalletAddress,
} from "@/lib/normalizers";
import type { UserRecord } from "@/features/auth/types/user";

type UserRow = UserRecord & RowDataPacket;

async function queryUsers(
  sql: string,
  values: DatabaseQueryValues = []
): Promise<UserRecord[]> {
  const [rows] = await pool.query<UserRow[]>(sql, [...values]);
  return rows;
}

export async function listUsers(): Promise<UserRecord[]> {
  return queryUsers(
    "SELECT id, username, wallet_address, created_at FROM users ORDER BY created_at DESC"
  );
}

export async function findUserByWalletAddress(
  walletAddress: string
): Promise<UserRecord | null> {
  const users = await queryUsers(
    "SELECT id, username, wallet_address, created_at FROM users WHERE wallet_address = ? LIMIT 1",
    [normalizeWalletAddress(walletAddress)]
  );

  return users[0] ?? null;
}

export async function findUserByUsername(
  username: string
): Promise<UserRecord | null> {
  const users = await queryUsers(
    "SELECT id, username, wallet_address, created_at FROM users WHERE LOWER(username) = ? LIMIT 1",
    [normalizeUsernameLookup(username)]
  );

  return users[0] ?? null;
}

export async function createUserRecord(
  username: string,
  walletAddress: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (username, wallet_address, created_at) VALUES (?, ?, NOW())",
    [username, normalizeWalletAddress(walletAddress)]
  );

  return result.insertId;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const users = await queryUsers(
    "SELECT id, username, wallet_address, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return users[0] ?? null;
}
