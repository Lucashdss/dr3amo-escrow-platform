import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import { listEscrowsForUser } from "@/features/escrows/server/escrowService";
import { parseEscrowManagementRequest } from "@/features/escrows/server/escrowRequests";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseEscrowManagementRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const user = await requireAuthenticatedUser(request);

    return createSuccessResponse(await listEscrowsForUser(user.id));
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/escrows/management error:", error);
    return createErrorResponse("Failed to fetch related escrows.", 500);
  }
}
