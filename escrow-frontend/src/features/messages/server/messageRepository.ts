import type { ResultSetHeader } from "mysql2";

import pool from "@/lib/db";
import type { CreateMessageInput } from "@/features/messages/types/message";

export async function createMessageRecord(
  request: CreateMessageInput
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO messages (user_id, name, email_address, message) VALUES (?, ?, ?, ?)",
    [request.userId, request.name, request.emailAddress, request.message]
  );

  return result.insertId;
}
