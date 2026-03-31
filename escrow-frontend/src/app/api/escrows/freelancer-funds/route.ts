import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import { parseFreelancerEscrowFundsRequest } from "@/features/escrows/server/escrowRequests";
import { getFreelancerEscrowSummary } from "@/features/escrows/server/escrowService";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseFreelancerEscrowFundsRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const user = await requireAuthenticatedUser(request);

    return createSuccessResponse(
      await getFreelancerEscrowSummary(user.id)
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/escrows/freelancer-funds error:", error);
    return createErrorResponse("Failed to fetch freelancer escrow funds.", 500);
  }
}
