import "server-only";
import nodemailer from "nodemailer";
import { buildVerificationUrl } from "./verification-url";

export type VerificationEmail = {
  recipient: string;
  rawToken: string;
};

type SmtpConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username?: string;
  password?: string;
};

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before sending verification email.`);
  }

  return value;
}

function getSmtpConfiguration(): SmtpConfiguration {
  const port = Number.parseInt(
    getRequiredEnvironmentVariable("SMTP_PORT"),
    10,
  );

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("SMTP_PORT must be a valid TCP port.");
  }

  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (Boolean(username) !== Boolean(password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be set together.");
  }

  return {
    host: getRequiredEnvironmentVariable("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE === "true",
    from: getRequiredEnvironmentVariable("SMTP_FROM"),
    username,
    password,
  };
}

export async function sendVerificationEmail(
  email: VerificationEmail,
): Promise<void> {
  const smtp = getSmtpConfiguration();
  const verificationUrl = buildVerificationUrl(
    getRequiredEnvironmentVariable("APP_URL"),
    email.rawToken,
  );
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.username && smtp.password
        ? {
            user: smtp.username,
            pass: smtp.password,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: smtp.from,
    to: email.recipient,
    subject: "Verify your OrgOS email address",
    text: `Verify your email address by opening this link:\n${verificationUrl}`,
  });
}
