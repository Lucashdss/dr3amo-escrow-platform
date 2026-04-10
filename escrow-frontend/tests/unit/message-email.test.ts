const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn((options: unknown) => ({
  options,
  sendMail: mockSendMail,
}));

jest.mock("nodemailer", () => ({
  createTransport: (options: unknown) => mockCreateTransport(options),
}));

import {
  createContactMessageMailOptions,
  sendContactMessageEmail,
} from "@/features/messages/server/messageEmail";

describe("messageEmail", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalRecipientEmail = process.env.CONTACT_MESSAGE_RECIPIENT_EMAIL;
  const originalGmailPassword = process.env.GMAIL_SMTP_APP_PASSWORD;
  const originalGmailUser = process.env.GMAIL_SMTP_USER;

  beforeEach(() => {
    jest.clearAllMocks();
    environment.CONTACT_MESSAGE_RECIPIENT_EMAIL = "team@example.com";
    environment.GMAIL_SMTP_APP_PASSWORD = "app-password";
    environment.GMAIL_SMTP_USER = "sender@gmail.com";
  });

  afterEach(() => {
    environment.CONTACT_MESSAGE_RECIPIENT_EMAIL = originalRecipientEmail;
    environment.GMAIL_SMTP_APP_PASSWORD = originalGmailPassword;
    environment.GMAIL_SMTP_USER = originalGmailUser;
  });

  it("builds the Gmail message with the submitted contact details", () => {
    const options = createContactMessageMailOptions({
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Need help with escrow onboarding.",
    });

    expect(options).toEqual({
      from: "sender@gmail.com",
      replyTo: "lucas@example.com",
      subject: "New Dr3amo contact message",
      text: [
        "New contact message",
        "",
        "Name: Lucas",
        "Email: lucas@example.com",
        "",
        "Message:",
        "Need help with escrow onboarding.",
      ].join("\n"),
      to: "team@example.com",
    });
  });

  it("sends contact messages through Gmail SMTP env configuration", async () => {
    mockSendMail.mockResolvedValueOnce(undefined);

    await sendContactMessageEmail({
      name: "Lucas",
      emailAddress: "lucas@example.com",
      message: "Hello",
    });

    expect(mockCreateTransport).toHaveBeenCalledWith({
      auth: {
        pass: "app-password",
        user: "sender@gmail.com",
      },
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "sender@gmail.com",
        replyTo: "lucas@example.com",
        to: "team@example.com",
      })
    );
  });
});
