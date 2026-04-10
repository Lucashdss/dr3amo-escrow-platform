import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { findAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import { isBotVerificationRequired } from "@/features/messages/constants";
import { parseCreateMessageRequest } from "@/features/messages/server/messageRequests";
import { createMessage } from "@/features/messages/server/messageService";
import { getClientIp } from "@/lib/security/clientIp";
import {
  consumeRateLimit,
  createRateLimitResponse,
} from "@/lib/security/rateLimit";
import { requireTurnstileVerification } from "@/lib/security/turnstile";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateMessageRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const clientIp = getClientIp(request);
    const rateLimitResult = await consumeRateLimit({
      identifier: clientIp,
      scope: "message_submit",
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        "message_submit",
        rateLimitResult.retryAfterSeconds
      );
    }

    if (isBotVerificationRequired()) {
      await requireTurnstileVerification({
        clientIp,
        token: parsedRequest.data.turnstileToken,
      });
    }

    const user = await findAuthenticatedUser(request);

    return createSuccessResponse(
      await createMessage({
        ...parsedRequest.data,
        userId: user?.id ?? null,
      }),
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/messages error:", error);
    return createErrorResponse("Failed to send message.", 500);
  }
}
