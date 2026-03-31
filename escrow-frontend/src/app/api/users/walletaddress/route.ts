import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import {
  parseWalletLookupRequest,
} from "@/features/auth/server/userRequests";
import { findUserByWallet } from "@/features/auth/server/userService";
import {
  consumeRateLimit,
  createRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const parsedRequest = parseWalletLookupRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const rateLimitResult = await consumeRateLimit({
      identifier: createRateLimitIdentifier(["user", String(user.id)]),
      scope: "user_lookup",
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        "user_lookup",
        rateLimitResult.retryAfterSeconds
      );
    }

    return createSuccessResponse(await findUserByWallet(parsedRequest.data));
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/users/walletaddress error:", error);
    return createErrorResponse("Failed to check wallet address.", 500);
  }
}
