import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool, { type DatabaseQueryValues } from "@/lib/db";

type WalletAuthNonceRecord = RowDataPacket & {
  challenge_nonce: string;
  created_at: Date | string;
  expires_at: Date | string;
  id: number;
  used_at: Date | string | null;
  wallet_address: string;
};

type WalletSessionRecord = RowDataPacket & {
  created_at: Date | string;
  expires_at: Date | string;
  id: number;
  last_seen_at: Date | string | null;
  revoked_at: Date | string | null;
  session_token_hash: string;
  wallet_address: string;
};

type CreateWalletAuthNonceParams = {
  challengeNonce: string;
  createdAt: Date;
  expiresAt: Date;
  walletAddress: string;
};

type CreateWalletSessionParams = {
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  sessionTokenHash: string;
  walletAddress: string;
};

async function findSingleRow<T extends RowDataPacket>(
  sql: string,
  values: DatabaseQueryValues
): Promise<T | null> {
  const [rows] = await pool.query<T[]>(sql, [...values]);
  return rows[0] ?? null;
}

export async function createWalletAuthNonce(
  params: CreateWalletAuthNonceParams
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO wallet_auth_nonces
      (wallet_address, challenge_nonce, expires_at, created_at)
      VALUES (?, ?, ?, ?)`,
    [
      params.walletAddress,
      params.challengeNonce,
      params.expiresAt,
      params.createdAt,
    ]
  );
  return result.insertId;
}

export async function findWalletAuthNonceById(
  id: number
): Promise<WalletAuthNonceRecord | null> {
  return findSingleRow<WalletAuthNonceRecord>(
    `SELECT id, wallet_address, challenge_nonce, expires_at, used_at, created_at
      FROM wallet_auth_nonces
      WHERE id = ?
      LIMIT 1`,
    [id]
  );
}

export async function consumeWalletAuthNonce(
  id: number,
  usedAt: Date
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE wallet_auth_nonces
      SET used_at = ?
      WHERE id = ? AND used_at IS NULL`,
    [usedAt, id]
  );
  return result.affectedRows > 0;
}

export async function createWalletSession(
  params: CreateWalletSessionParams
): Promise<void> {
  await pool.query(
    `INSERT INTO wallet_sessions
      (session_token_hash, wallet_address, expires_at, last_seen_at, created_at)
      VALUES (?, ?, ?, ?, ?)`,
    [
      params.sessionTokenHash,
      params.walletAddress,
      params.expiresAt,
      params.lastSeenAt,
      params.createdAt,
    ]
  );
}

export async function findWalletSessionByHash(
  sessionTokenHash: string
): Promise<WalletSessionRecord | null> {
  return findSingleRow<WalletSessionRecord>(
    `SELECT id, session_token_hash, wallet_address, expires_at, revoked_at,
        last_seen_at, created_at
      FROM wallet_sessions
      WHERE session_token_hash = ?
      LIMIT 1`,
    [sessionTokenHash]
  );
}

export async function revokeWalletSessionByHash(
  sessionTokenHash: string,
  revokedAt: Date
): Promise<void> {
  await pool.query(
    `UPDATE wallet_sessions
      SET revoked_at = ?
      WHERE session_token_hash = ? AND revoked_at IS NULL`,
    [revokedAt, sessionTokenHash]
  );
}

export async function touchWalletSessionByHash(
  sessionTokenHash: string,
  lastSeenAt: Date
): Promise<void> {
  await pool.query(
    `UPDATE wallet_sessions
      SET last_seen_at = ?
      WHERE session_token_hash = ?`,
    [lastSeenAt, sessionTokenHash]
  );
}
