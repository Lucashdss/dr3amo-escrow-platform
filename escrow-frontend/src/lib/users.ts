import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export type UserRow = RowDataPacket & {
  id: number;
  username: string;
  wallet_address: string;
  created_at: string;
};

export async function findUserByWalletAddress(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.trim().toLowerCase();

  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, username, wallet_address, created_at FROM users WHERE wallet_address = ? LIMIT 1",
    [normalizedWalletAddress]
  );

  return rows[0] ?? null;
}
