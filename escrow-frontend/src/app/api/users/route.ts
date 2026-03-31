import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import { createUser } from "@/features/auth/server/userService";
import { getAuthSession } from "@/features/auth/server/walletAuthService";
import { parseCreateUserRequest } from "@/features/auth/server/userRequests";
import { readSessionToken } from "@/features/auth/server/sessionCookie";
import { getClientIp } from "@/lib/security/clientIp";
import {
  consumeRateLimit,
  createRateLimitResponse,
} from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateUserRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const rateLimitResult = await consumeRateLimit({
      identifier: getClientIp(request),
      scope: "user_create",
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        "user_create",
        rateLimitResult.retryAfterSeconds
      );
    }

    const sessionToken = readSessionToken(request);

    if (!sessionToken) {
      return createErrorResponse("Authentication required.", 401);
    }

    const session = await getAuthSession(sessionToken);

    if (!session) {
      return createErrorResponse("Authentication required.", 401);
    }

    const result = await createUser(parsedRequest.data, session.walletAddress);
    return createSuccessResponse(result.data, result.status);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/users error:", error);
    return createErrorResponse("Failed to process request.", 500);
  }
}
