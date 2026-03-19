import { AppError } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/responses";
import {
  createUser,
  listUsers,
} from "@/features/auth/server/userService";
import { parseCreateUserRequest } from "@/features/auth/server/userRequests";

export async function GET() {
  try {
    return createSuccessResponse(await listUsers());
  } catch (error) {
    console.error("GET /api/users error:", error);
    return createErrorResponse("Failed to fetch users.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const parsedRequest = parseCreateUserRequest(await request.json());

    if (!parsedRequest.success) {
      return createErrorResponse(parsedRequest.error, 400);
    }

    const result = await createUser(parsedRequest.data);
    return createSuccessResponse(result.data, result.status);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status);
    }

    console.error("POST /api/users error:", error);
    return createErrorResponse("Failed to process request.", 500);
  }
}
