import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  parseUsernameLookupRequest,
} from "@/features/auth/server/userRequests";
import { findUserByName } from "@/features/auth/server/userService";

export async function GET(request: Request) {
  try {
    const parsedRequest = parseUsernameLookupRequest(request);

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    return createSuccessResponse(await findUserByName(parsedRequest.data));
  } catch (error) {
    console.error("GET /api/users/username error:", error);
    return createErrorResponse("Failed to check username.", 500);
  }
}
