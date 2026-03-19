import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  parseWalletLookupRequest,
} from "@/features/auth/server/userRequests";
import { findUserByWallet } from "@/features/auth/server/userService";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseWalletLookupRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(await findUserByWallet(parsedRequest.data));
  } catch (error) {
    console.error("GET /api/users/walletaddress error:", error);
    return createErrorResponse("Failed to check wallet address.", 500);
  }
}
