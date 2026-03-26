import { AppError } from "@/lib/errors";
import { createMessage } from "@/features/messages/server/messageService";

describe("createMessage", () => {
  it("creates a message without a user", async () => {
    const result = await createMessage(
      {
        userId: null,
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
      },
      {
        createMessageRecord: jest.fn().mockResolvedValue(12),
        findUserById: jest.fn(),
      }
    );

    expect(result).toEqual({
      id: 12,
      message: "Message sent successfully.",
    });
  });

  it("rejects unknown users", async () => {
    await expect(
      createMessage(
        {
          userId: 4,
          name: "Lucas",
          emailAddress: "lucas@example.com",
          message: "Hello",
        },
        {
          createMessageRecord: jest.fn(),
          findUserById: jest.fn().mockResolvedValue(null),
        }
      )
    ).rejects.toBeInstanceOf(AppError);
  });
});
