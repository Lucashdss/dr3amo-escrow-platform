import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";

import { readSessionToken } from "./sessionCookie";
import { getAuthSession } from "./walletAuthService";

export async function requireAuthenticatedUser(
  request: Request
): Promise<UserRecord> {
  const sessionToken = readSessionToken(request);

  if (!sessionToken) {
    throw new AppError("Authentication required.", 401);
  }

  const session = await getAuthSession(sessionToken);

  if (!session) {
    throw new AppError("Authentication required.", 401);
  }

  if (!session.user) {
    throw new AppError("Registered user required.", 403);
  }

  return session.user;
}
