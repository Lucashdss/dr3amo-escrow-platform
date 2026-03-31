import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  readSessionToken,
} from "@/features/auth/server/sessionCookie";
import {
  getAuthSession,
} from "@/features/auth/server/walletAuthService";

export async function GET(request: Request) {
  try {
    const sessionToken = readSessionToken(request);

    if (!sessionToken) {
      return createErrorResponse("Authentication required.", 401);
    }

    const session = await getAuthSession(sessionToken);

    if (!session) {
      return createErrorResponse("Authentication required.", 401);
    }

    return createSuccessResponse(session);
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return createErrorResponse("Failed to load session.", 500);
  }
}
