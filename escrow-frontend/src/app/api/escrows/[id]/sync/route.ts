import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { requireAuthenticatedUser } from "@/features/auth/server/authenticatedUser";
import { syncEscrowAction } from "@/features/escrows/server/escrowService";
import {
  parseEscrowRouteId,
  parseEscrowSyncRequest,
} from "@/features/escrows/server/escrowRequests";

type EscrowSyncRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: EscrowSyncRouteContext
) {
  try {
    const { id } = await context.params;
    const parsedEscrowId = parseEscrowRouteId(id);

    if (!parsedEscrowId.success) {
      return createErrorResponse(parsedEscrowId.error, 400);
    }

    const parsedRequest = parseEscrowSyncRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const user = await requireAuthenticatedUser(request);

    return createSuccessResponse(
      await syncEscrowAction(
        parsedEscrowId.data,
        user,
        parsedRequest.data.txHash,
        parsedRequest.data.action
      )
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/escrows/[id]/sync error:", error);
    return createErrorResponse("Failed to sync escrow action.", 500);
  }
}
