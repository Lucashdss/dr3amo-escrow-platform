import { parseCreateMessageRequest } from "@/features/messages/server/messageRequests";

describe("parseCreateMessageRequest", () => {
  it("parses a valid message request", () => {
    const result = parseCreateMessageRequest({
      userId: 7,
      name: "Lucas",
      emailAddress: "Lucas@Example.com",
      message: "Need help with escrow onboarding.",
    });

    expect(result).toEqual({
      success: true,
      data: {
        userId: 7,
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Need help with escrow onboarding.",
      },
    });
  });

  it("rejects invalid email addresses", () => {
    const result = parseCreateMessageRequest({
      userId: null,
      name: "Lucas",
      emailAddress: "not-an-email",
      message: "Hello",
    });

    expect(result).toEqual({
      success: false,
      error: "emailAddress must be valid.",
    });
  });

  it("rejects invalid user ids", () => {
    const result = parseCreateMessageRequest({
      userId: 0,
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
    });

    expect(result).toEqual({
      success: false,
      error: "userId must be a positive integer.",
    });
  });
});
