import { fetchApi } from "@/lib/api/fetch";
import { normalizeEmailAddress } from "@/lib/normalizers";
import type {
  CreateMessageRequest,
  CreateMessageResult,
} from "@/features/messages/types/message";

function buildCreateMessagePayload(
  request: CreateMessageRequest
): CreateMessageRequest {
  return {
    name: request.name.trim(),
    emailAddress: normalizeEmailAddress(request.emailAddress),
    message: request.message.trim(),
    turnstileToken: request.turnstileToken.trim(),
  };
}

export async function createMessage(
  request: CreateMessageRequest
): Promise<CreateMessageResult> {
  return fetchApi<CreateMessageResult>("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildCreateMessagePayload(request)),
  });
}
