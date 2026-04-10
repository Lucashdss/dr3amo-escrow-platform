import { AppError } from "@/lib/errors";
import type { UserRecord } from "@/features/auth/types/user";
import * as userRepository from "@/features/auth/server/userRepository";
import { sendContactMessageEmail } from "@/features/messages/server/messageEmail";
import * as messageRepository from "@/features/messages/server/messageRepository";
import type {
  CreateMessageInput,
  CreateMessageResult,
} from "@/features/messages/types/message";

type MessageDependencies = {
  createMessageRecord: typeof messageRepository.createMessageRecord;
  findUserById: typeof userRepository.findUserById;
  sendContactMessageEmail: typeof sendContactMessageEmail;
};

const defaultDependencies: MessageDependencies = {
  createMessageRecord: messageRepository.createMessageRecord,
  findUserById: userRepository.findUserById,
  sendContactMessageEmail,
};

const MAX_MESSAGE_ATTEMPTS = 2;

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
  request: CreateMessageInput,
  dependencies: MessageDependencies = defaultDependencies
): Promise<CreateMessageResult> {
  if (request.userId) {
    await loadMessageUser(request.userId, dependencies.findUserById);
  }

  const id = await runMessageOperation(
    () => dependencies.createMessageRecord(request),
    "Failed to create contact message record."
  );

  await runMessageOperation(
    () => dependencies.sendContactMessageEmail(request),
    "Failed to send contact message email."
  );

  return {
    id,
    message: "Message sent successfully.",
  };
}

async function runMessageOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_MESSAGE_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }

  console.error(errorMessage, lastError);
  throw new AppError("Failed to send message.", 500);
}
