export type CreateMessageRequest = {
  emailAddress: string;
  message: string;
  name: string;
  userId: number | null;
};

export type CreateMessageResult = {
  id: number;
  message: string;
};
