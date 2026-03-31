import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import { createWalletChallenge } from "@/features/auth/server/walletAuthService";
import { parseCreateWalletNonceRequest } from "@/features/auth/server/walletAuthRequests";
import { getClientIp } from "@/lib/security/clientIp";
import {
  consumeRateLimit,
  createRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateWalletNonceRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const rateLimitResult = await consumeRateLimit({
      identifier: createRateLimitIdentifier([
        parsedRequest.data.walletAddress,
        getClientIp(request),
      ]),
      scope: "wallet_nonce",
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        "wallet_nonce",
        rateLimitResult.retryAfterSeconds
      );
    }

    return createSuccessResponse(
      await createWalletChallenge(parsedRequest.data.walletAddress),
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/auth/wallet/nonce error:", error);
    return createErrorResponse("Failed to create wallet challenge.", 500);
  }
}
