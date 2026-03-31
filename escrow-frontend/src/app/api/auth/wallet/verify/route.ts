import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  SESSION_TTL_MS,
  setSessionCookie,
} from "@/features/auth/server/sessionCookie";
import {
  verifyWalletChallenge,
} from "@/features/auth/server/walletAuthService";
import {
  parseVerifyWalletSignatureRequest,
} from "@/features/auth/server/walletAuthRequests";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseVerifyWalletSignatureRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const result = await verifyWalletChallenge(parsedRequest.data);
    const response = createSuccessResponse(result.data);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    setSessionCookie(response, result.sessionToken, expiresAt);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/auth/wallet/verify error:", error);
    return createErrorResponse("Failed to verify wallet signature.", 500);
  }
}
