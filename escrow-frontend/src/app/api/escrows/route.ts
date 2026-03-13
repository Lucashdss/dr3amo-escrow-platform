import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

type EscrowRow = RowDataPacket & {
  id: number;
  contract_address: string;
  client_id: number;
  freelancer_id: number;
  token_id: number;
  chain_id: number;
  amount: string;
  deadline: string;
  state: string;
  created_at: string;
};

export async function GET() {
  try {
    const [rows] = await pool.query<EscrowRow[]>(
      "SELECT id, contract_address, client_id, freelancer_id, token_id, chain_id, amount, deadline, state, created_at FROM escrows ORDER BY created_at DESC"
    );

    return NextResponse.json({ escrows: rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/escrows error:", error);
    return NextResponse.json(
      { error: "Failed to fetch escrows." },
      { status: 500 }
    );
  }
}

