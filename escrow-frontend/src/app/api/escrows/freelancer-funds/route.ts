import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { parseFreelancerEscrowFundsRequest } from "@/features/escrows/server/escrowRequests";
import { getFreelancerEscrowSummary } from "@/features/escrows/server/escrowService";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseFreelancerEscrowFundsRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(
      await getFreelancerEscrowSummary(parsedRequest.data)
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/escrows/freelancer-funds error:", error);
    return createErrorResponse("Failed to fetch freelancer escrow funds.", 500);
  }
}
