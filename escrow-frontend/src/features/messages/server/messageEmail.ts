import "server-only";

import {
  createTransport,
  type SendMailOptions,
  type Transporter,
} from "nodemailer";

import {
  getContactMessageRecipientEmail,
  getGmailSmtpAppPassword,
  getGmailSmtpUser,
} from "@/lib/env/server";
import type { CreateMessageInput } from "@/features/messages/types/message";

type ContactMessageEmail = Pick<
  CreateMessageInput,
  "emailAddress" | "message" | "name"
>;

const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 465;
const CONTACT_MESSAGE_SUBJECT = "New Dr3amo contact message";

export async function sendContactMessageEmail(
  request: ContactMessageEmail
): Promise<void> {
  const transporter = createGmailTransport();

  await transporter.sendMail(createContactMessageMailOptions(request));
}

export function createContactMessageMailOptions(
  request: ContactMessageEmail
): SendMailOptions {
  return {
    from: getGmailSmtpUser(),
    replyTo: request.emailAddress,
    subject: CONTACT_MESSAGE_SUBJECT,
    text: createContactMessageText(request),
    to: getContactMessageRecipientEmail(),
  };
}

function createGmailTransport(): Transporter {
  return createTransport({
    auth: {
      pass: getGmailSmtpAppPassword(),
      user: getGmailSmtpUser(),
    },
    host: GMAIL_SMTP_HOST,
    port: GMAIL_SMTP_PORT,
    secure: true,
  });
}

function createContactMessageText(request: ContactMessageEmail): string {
  return [
    "New contact message",
    "",
    `Name: ${request.name}`,
    `Email: ${request.emailAddress}`,
    "",
    "Message:",
    request.message,
  ].join("\n");
}
