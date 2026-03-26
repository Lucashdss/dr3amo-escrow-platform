import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";
import * as userRepository from "@/features/auth/server/userRepository";
import * as messageRepository from "@/features/messages/server/messageRepository";
import type {
  CreateMessageRequest,
  CreateMessageResult,
} from "@/features/messages/types/message";

type MessageDependencies = {
  createMessageRecord: typeof messageRepository.createMessageRecord;
  findUserById: typeof userRepository.findUserById;
};

const defaultDependencies: MessageDependencies = {
  createMessageRecord: messageRepository.createMessageRecord,
  findUserById: userRepository.findUserById,
};

async function loadMessageUser(
  userId: number,
  findUserById: (id: number) => Promise<UserRecord | null>
): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("userId is invalid.", 400);
  }
}

export async function createMessage(
  request: CreateMessageRequest,
  dependencies: MessageDependencies = defaultDependencies
): Promise<CreateMessageResult> {
  if (request.userId) {
    await loadMessageUser(request.userId, dependencies.findUserById);
  }

  const id = await dependencies.createMessageRecord(request);

  return {
    id,
    message: "Message sent successfully.",
  };
}
