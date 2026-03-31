import { parseCreateMessageRequest } from "@/features/messages/server/messageRequests";

describe("parseCreateMessageRequest", () => {
  it("parses a valid message request", () => {
    const result = parseCreateMessageRequest({
      name: "Lucas",
      emailAddress: "Lucas@Example.com",
      message: "Need help with escrow onboarding.",
      turnstileToken: "token",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Need help with escrow onboarding.",
        turnstileToken: "token",
      },
    });
  });

  it("rejects invalid email addresses", () => {
    const result = parseCreateMessageRequest({
      name: "Lucas",
      emailAddress: "not-an-email",
      message: "Hello",
      turnstileToken: "token",
    });

    expect(result).toEqual({
      success: false,
      error: "emailAddress must be valid.",
    });
  });

  it("rejects client-supplied user ids", () => {
    const result = parseCreateMessageRequest({
      userId: 7,
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
      turnstileToken: "token",
    });

    expect(result).toEqual({
      success: false,
      error: "userId must not be provided.",
    });
  });

  it("rejects missing turnstile tokens", () => {
    const result = parseCreateMessageRequest({
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
    });

    expect(result).toEqual({
      success: false,
      error: "turnstileToken is required.",
    });
  });

  it("rejects messages longer than 2000 characters", () => {
    const result = parseCreateMessageRequest({
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "a".repeat(2001),
      turnstileToken: "token",
    });

    expect(result).toEqual({
      success: false,
      error: "message must be 2000 characters or fewer.",
    });
  });
});
