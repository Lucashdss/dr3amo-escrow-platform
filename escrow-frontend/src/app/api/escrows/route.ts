import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { createEscrow, listEscrows } from "@/features/escrows/server/escrowService";
import { parseCreateEscrowRequest } from "@/features/escrows/server/escrowRequests";

export async function GET() {
  try {
    return createSuccessResponse(await listEscrows());
  } catch (error) {
    console.error("GET /api/escrows error:", error);
    return createErrorResponse("Failed to fetch escrows.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateEscrowRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(await createEscrow(parsedRequest.data), 201);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/escrows error:", error);
    return createErrorResponse("Failed to create escrow record.", 500);
  }
}
