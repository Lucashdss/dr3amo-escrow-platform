import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { findUserByWalletAddress, type UserRow } from "@/lib/users";

export async function GET() {
  try {
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, username, wallet_address, created_at FROM users ORDER BY created_at DESC"
    );

    return NextResponse.json({ users: rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = body?.walletAddress?.trim()?.toLowerCase();
    const username = body?.username?.trim();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required." },
        { status: 400 }
      );
    }

    const existingUser = await findUserByWalletAddress(walletAddress);

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists.",
          user: existingUser,
        },
        { status: 200 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "username is required for new users." },
        { status: 400 }
      );
    }

    const [insertResult] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (username, wallet_address, created_at) VALUES (?, ?, NOW())",
      [username, walletAddress]
    );

    const [newUserRows] = await pool.query<UserRow[]>(
      "SELECT id, username, wallet_address, created_at FROM users WHERE id = ? LIMIT 1",
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: newUserRows[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
