import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import { createEscrow } from "@/features/escrows/server/escrowService";
import { parseCreateEscrowRequest } from "@/features/escrows/server/escrowRequests";

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateEscrowRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const user = await requireAuthenticatedUser(request);

    return createSuccessResponse(
      await createEscrow(parsedRequest.data, user.wallet_address),
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/escrows error:", error);
    return createErrorResponse("Failed to create escrow record.", 500);
  }
}
