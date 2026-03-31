import {
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/features/auth/server/sessionCookie";
import {
  revokeAuthSession,
} from "@/features/auth/server/walletAuthService";

export async function POST(request: Request) {
  try {
    const sessionToken = readSessionToken(request);
    const response = createSuccessResponse({ message: "Logged out successfully." });

    if (sessionToken) {
      await revokeAuthSession(sessionToken);
    }

    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    const response = createSuccessResponse({ message: "Logged out successfully." });
    clearSessionCookie(response);
    return response;
  }
}
