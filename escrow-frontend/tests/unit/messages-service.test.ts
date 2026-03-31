import { AppError } from "@/lib/errors";
import { createMessage } from "@/features/messages/server/messageService";

describe("createMessage", () => {
  it("creates a message without a user", async () => {
    const createMessageRecord = jest.fn().mockResolvedValue(12);

    const result = await createMessage(
      {
        userId: null,
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      },
      {
        createMessageRecord,
        findUserById: jest.fn(),
      }
    );

    expect(result).toEqual({
      id: 12,
      message: "Message sent successfully.",
    });
    expect(createMessageRecord).toHaveBeenCalledWith({
      emailAddress: "lucas@example.com",
      message: "Hello",
      name: "Lucas",
      turnstileToken: "token",
      userId: null,
    });
  });

  it("rejects a forged userId that does not exist", async () => {
    const createMessageRecord = jest.fn();

    await expect(
      createMessage(
        {
          userId: 4,
          name: "Lucas",
          emailAddress: "lucas@example.com",
          message: "Hello",
          turnstileToken: "token",
        },
        {
          createMessageRecord,
          findUserById: jest.fn().mockResolvedValue(null),
        }
      )
    ).rejects.toMatchObject({
      message: "userId is invalid.",
      status: 400,
    });

    expect(createMessageRecord).not.toHaveBeenCalled();
  });
});
