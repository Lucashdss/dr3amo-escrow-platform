const mockCreateMessage = jest.fn();
const mockConsumeRateLimit = jest.fn();
const mockFindAuthenticatedUser = jest.fn();
const mockRequireTurnstileVerification = jest.fn();

jest.mock("@/features/messages/server/messageService", () => ({
  createMessage: (...args: unknown[]) => mockCreateMessage(...args),
}));

jest.mock("@/features/auth/server/authenticatedUser", () => ({
  findAuthenticatedUser: (...args: unknown[]) => mockFindAuthenticatedUser(...args),
}));

jest.mock("@/lib/security/rateLimit", () => {
  const actual = jest.requireActual("@/lib/security/rateLimit");

  return {
    ...actual,
    consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
  };
});

jest.mock("@/lib/security/turnstile", () => ({
  BOT_VERIFICATION_FAILED_MESSAGE: "Bot verification failed.",
  requireTurnstileVerification: (...args: unknown[]) =>
    mockRequireTurnstileVerification(...args),
}));

import { AppError } from "@/lib/errors";
import { POST } from "@/app/api/messages/route";

describe("/api/messages route", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    environment.NODE_ENV = "test";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    mockRequireTurnstileVerification.mockResolvedValue(undefined);
    mockFindAuthenticatedUser.mockResolvedValue(null);
    mockCreateMessage.mockResolvedValue({
      id: 7,
      message: "Message sent successfully.",
    });
  });

  afterEach(() => {
    environment.NODE_ENV = originalNodeEnv;
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when the turnstile token is missing", async () => {
    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "turnstileToken is required." },
      success: false,
    });
  });

  it("returns 429 when message submission is rate limited", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 33,
    });

    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("33");
    expect(body).toEqual({
      data: null,
      error: { message: "Too many message requests. Try again later." },
      success: false,
    });
  });

  it("returns 400 when bot verification fails", async () => {
    mockRequireTurnstileVerification.mockRejectedValueOnce(
      new AppError("Bot verification failed.", 400)
    );

    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "Bot verification failed." },
      success: false,
    });
  });

  it("returns 400 when the request includes a forged userId", async () => {
    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        userId: 999,
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      data: null,
      error: { message: "userId must not be provided." },
      success: false,
    });
    expect(mockCreateMessage).not.toHaveBeenCalled();
    expect(mockRequireTurnstileVerification).not.toHaveBeenCalled();
  });

  it("derives the message userId from the authenticated session", async () => {
    mockFindAuthenticatedUser.mockResolvedValueOnce({
      id: 9,
      username: "lucas",
      wallet_address: "0xabc",
      created_at: "2026-03-16T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: {
        "Content-Type": "application/json",
        cookie: "dr3amo_session=token123",
      },
      method: "POST",
    });

    await POST(request);

    expect(mockCreateMessage).toHaveBeenCalledWith({
      userId: 9,
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
      turnstileToken: "token",
    });
  });

  it("creates a message when rate limit and bot verification pass", async () => {
    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mockRequireTurnstileVerification).toHaveBeenCalledWith({
      clientIp: "203.0.113.10",
      token: "token",
    });
    expect(mockCreateMessage).toHaveBeenCalledWith({
      userId: null,
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
      turnstileToken: "token",
    });
    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        id: 7,
        message: "Message sent successfully.",
      },
      error: null,
      success: true,
    });
  });

  it("skips bot verification in development", async () => {
    environment.NODE_ENV = "development";

    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockRequireTurnstileVerification).not.toHaveBeenCalled();
    expect(mockCreateMessage).toHaveBeenCalledWith({
      userId: null,
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
      turnstileToken: "",
    });
  });

  it("returns the generic message error when message delivery fails", async () => {
    mockCreateMessage.mockRejectedValueOnce(
      new AppError("Failed to send message.", 500)
    );

    const request = new Request("http://localhost/api/messages", {
      body: JSON.stringify({
        name: "Lucas",
        emailAddress: "lucas@example.com",
        message: "Hello",
        turnstileToken: "token",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      data: null,
      error: { message: "Failed to send message." },
      success: false,
    });
  });
});
