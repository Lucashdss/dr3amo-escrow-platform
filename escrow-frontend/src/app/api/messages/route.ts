import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { parseCreateMessageRequest } from "@/features/messages/server/messageRequests";
import { createMessage } from "@/features/messages/server/messageService";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateMessageRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(await createMessage(parsedRequest.data), 201);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/messages error:", error);
    return createErrorResponse("Failed to send message.", 500);
  }
}
