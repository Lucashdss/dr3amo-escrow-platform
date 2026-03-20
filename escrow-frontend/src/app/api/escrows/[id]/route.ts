import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { getEscrowManagementDetail } from "@/features/escrows/server/escrowService";
import { parseEscrowManagementDetailRequest } from "@/features/escrows/server/escrowRequests";

type EscrowDetailRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: EscrowDetailRouteContext
) {
  try {
    const { id } = await context.params;
    const parsedRequest = parseEscrowManagementDetailRequest(request, id);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(
      await getEscrowManagementDetail(parsedRequest.data.id, parsedRequest.data.userId)
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/escrows/[id] error:", error);
    return createErrorResponse("Failed to fetch escrow detail.", 500);
  }
}
