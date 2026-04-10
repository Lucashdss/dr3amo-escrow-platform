import { createMessage } from "@/features/messages/server/messageService";
import type { CreateMessageInput } from "@/features/messages/types/message";

function createMessageInput(): CreateMessageInput {
  return {
    userId: null,
    name: "Lucas",
    emailAddress: "lucas@example.com",
    message: "Hello",
    turnstileToken: "token",
  };
}

describe("createMessage", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("creates a message and sends the notification email", async () => {
    const createMessageRecord = jest.fn().mockResolvedValue(12);
    const sendContactMessageEmail = jest.fn().mockResolvedValue(undefined);
    const request = createMessageInput();

    const result = await createMessage(request, {
      createMessageRecord,
      findUserById: jest.fn(),
      sendContactMessageEmail,
    });

    expect(result).toEqual({
      id: 12,
      message: "Message sent successfully.",
    });
    expect(createMessageRecord).toHaveBeenCalledWith(request);
    expect(sendContactMessageEmail).toHaveBeenCalledWith(request);
  });

  it("retries the message record when the first insert fails", async () => {
    const createMessageRecord = jest
      .fn()
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce(13);
    const sendContactMessageEmail = jest.fn().mockResolvedValue(undefined);

    const result = await createMessage(createMessageInput(), {
      createMessageRecord,
      findUserById: jest.fn(),
      sendContactMessageEmail,
    });

    expect(result.id).toBe(13);
    expect(createMessageRecord).toHaveBeenCalledTimes(2);
    expect(sendContactMessageEmail).toHaveBeenCalledTimes(1);
  });

  it("retries the notification email when the first send fails", async () => {
    const createMessageRecord = jest.fn().mockResolvedValue(14);
    const sendContactMessageEmail = jest
      .fn()
      .mockRejectedValueOnce(new Error("smtp unavailable"))
      .mockResolvedValueOnce(undefined);

    const result = await createMessage(createMessageInput(), {
      createMessageRecord,
      findUserById: jest.fn(),
      sendContactMessageEmail,
    });

    expect(result.id).toBe(14);
    expect(createMessageRecord).toHaveBeenCalledTimes(1);
    expect(sendContactMessageEmail).toHaveBeenCalledTimes(2);
  });

  it("rejects a forged userId that does not exist", async () => {
    const createMessageRecord = jest.fn();
    const sendContactMessageEmail = jest.fn();
    const request = {
      ...createMessageInput(),
      userId: 4,
    };

    await expect(
      createMessage(request, {
        createMessageRecord,
        findUserById: jest.fn().mockResolvedValue(null),
        sendContactMessageEmail,
      })
    ).rejects.toMatchObject({
      message: "userId is invalid.",
      status: 400,
    });

    expect(createMessageRecord).not.toHaveBeenCalled();
    expect(sendContactMessageEmail).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database insert fails twice", async () => {
    const createMessageRecord = jest
      .fn()
      .mockRejectedValue(new Error("database unavailable"));
    const sendContactMessageEmail = jest.fn();

    await expect(
      createMessage(createMessageInput(), {
        createMessageRecord,
        findUserById: jest.fn(),
        sendContactMessageEmail,
      })
    ).rejects.toMatchObject({
      message: "Failed to send message.",
      status: 500,
    });

    expect(createMessageRecord).toHaveBeenCalledTimes(2);
    expect(sendContactMessageEmail).not.toHaveBeenCalled();
  });

  it("returns a generic error when the notification email fails twice", async () => {
    const createMessageRecord = jest.fn().mockResolvedValue(15);
    const sendContactMessageEmail = jest
      .fn()
      .mockRejectedValue(new Error("smtp unavailable"));

    await expect(
      createMessage(createMessageInput(), {
        createMessageRecord,
        findUserById: jest.fn(),
        sendContactMessageEmail,
      })
    ).rejects.toMatchObject({
      message: "Failed to send message.",
      status: 500,
    });

    expect(createMessageRecord).toHaveBeenCalledTimes(1);
    expect(sendContactMessageEmail).toHaveBeenCalledTimes(2);
  });
});
