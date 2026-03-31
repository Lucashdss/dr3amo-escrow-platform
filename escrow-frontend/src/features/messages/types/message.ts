export type CreateMessageRequest = {
  emailAddress: string;
  message: string;
  name: string;
  turnstileToken: string;
};

export type CreateMessageInput = CreateMessageRequest & {
  userId: number | null;
};

export type CreateMessageResult = {
  id: number;
  message: string;
};
