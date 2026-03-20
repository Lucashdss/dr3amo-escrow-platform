import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { listEscrowsForUser } from "@/features/escrows/server/escrowService";
import { parseEscrowManagementRequest } from "@/features/escrows/server/escrowRequests";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseEscrowManagementRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(await listEscrowsForUser(parsedRequest.data));
  } catch (error) {
    console.error("GET /api/escrows/management error:", error);
    return createErrorResponse("Failed to fetch related escrows.", 500);
  }
}
