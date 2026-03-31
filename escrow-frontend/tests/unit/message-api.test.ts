import { createMessage } from "@/features/messages/services/messageApi";

describe("createMessage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 9,
          message: "Message sent successfully.",
        },
        error: null,
      }),
      ok: true,
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends the normalized message payload including the turnstile token", async () => {
    await createMessage({
      name: " Lucas ",
      emailAddress: "Lucas@Example.com ",
      message: " Hello world ",
      turnstileToken: " token ",
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello world",
        turnstileToken: "token",
      }),
    });
  });
});
