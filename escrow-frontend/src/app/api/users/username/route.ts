import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import {
  parseUsernameLookupRequest,
} from "@/features/auth/server/userRequests";
import { findUserByName } from "@/features/auth/server/userService";
import {
  consumeRateLimit,
  createRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const parsedRequest = parseUsernameLookupRequest(request);

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

    return createSuccessResponse(await findUserByName(parsedRequest.data));
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/users/username error:", error);
    return createErrorResponse("Failed to check username.", 500);
  }
}
