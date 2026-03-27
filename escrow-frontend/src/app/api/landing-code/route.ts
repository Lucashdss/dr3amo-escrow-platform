import { createErrorResponse, createSuccessResponse } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { getLandingCodePreview } from "@/features/landing-code/server/landingCodeService";

export async function GET() {
  try {
    return createSuccessResponse(await getLandingCodePreview());
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("GET /api/landing-code error:", error);
    return createErrorResponse("Failed to load landing code.", 500);
  }
}
