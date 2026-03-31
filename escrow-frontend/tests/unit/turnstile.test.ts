import { AppError } from "@/lib/errors";
import {
  BOT_VERIFICATION_FAILED_MESSAGE,
  requireTurnstileVerification,
} from "@/lib/security/turnstile";

describe("requireTurnstileVerification", () => {
  it("accepts a successful verification response", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
      ok: true,
    });

    await expect(
      requireTurnstileVerification(
        { clientIp: "203.0.113.1", token: "token" },
        {
          fetch: fetchMock as unknown as typeof fetch,
          getTurnstileSecretKey: () => "secret",
        }
      )
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("rejects unsuccessful verification responses", async () => {
    await expect(
      requireTurnstileVerification(
        { clientIp: "203.0.113.1", token: "token" },
        {
          fetch: jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: false }),
            ok: true,
          }) as unknown as typeof fetch,
          getTurnstileSecretKey: () => "secret",
        }
      )
    ).rejects.toMatchObject({
      message: BOT_VERIFICATION_FAILED_MESSAGE,
      status: 400,
    });

    await expect(
      requireTurnstileVerification(
        { clientIp: "203.0.113.1", token: "token" },
        {
          fetch: jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: false }),
            ok: true,
          }) as unknown as typeof fetch,
          getTurnstileSecretKey: () => "secret",
        }
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it("fails closed when verification cannot be completed", async () => {
    await expect(
      requireTurnstileVerification(
        { clientIp: "203.0.113.1", token: "token" },
        {
          fetch: jest.fn().mockRejectedValue(
            new Error("network")
          ) as unknown as typeof fetch,
          getTurnstileSecretKey: () => "secret",
        }
      )
    ).rejects.toMatchObject({
      message: BOT_VERIFICATION_FAILED_MESSAGE,
      status: 400,
    });

    await expect(
      requireTurnstileVerification(
        { clientIp: "203.0.113.1", token: "token" },
        {
          fetch: jest.fn().mockRejectedValue(
            new Error("network")
          ) as unknown as typeof fetch,
          getTurnstileSecretKey: () => "secret",
        }
      )
    ).rejects.toBeInstanceOf(AppError);
  });
});
