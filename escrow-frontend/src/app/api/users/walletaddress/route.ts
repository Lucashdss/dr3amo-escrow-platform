import { NextResponse } from "next/server";
import { findUserByWalletAddress } from "@/lib/users";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress")?.trim()?.toLowerCase();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress query param is required." },
        { status: 400 }
      );
    }

    const user = await findUserByWalletAddress(walletAddress);

    return NextResponse.json(
      {
        exists: Boolean(user),
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/users/walletaddress error:", error);
    return NextResponse.json(
      { error: "Failed to check wallet address." },
      { status: 500 }
    );
  }
}
