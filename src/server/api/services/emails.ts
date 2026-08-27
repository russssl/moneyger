import { env } from "@/env";
import { ResetPasswordEmailTemplate, VerificationEmailTemplate } from "@/server/components/email-template";
import nodemailer from "nodemailer";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";

type SendEmailOptions = {
  to: string;
  subject: string;
  react: React.ReactElement;
};

let smtpTransport: nodemailer.Transporter | null = null;

function getSmtpTransport(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (smtpTransport) return smtpTransport;
  smtpTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    } : undefined,
  });
  return smtpTransport;
}

function renderReactToHtml(react: React.ReactElement): string {
  return `<!DOCTYPE html>${renderToStaticMarkup(react)}`;
}

function extractEmail(address: string): string {
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const match = address.match(/<([^>]+)>/);
  return match ? match[1]!.trim() : address.trim();
}

async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const html = renderReactToHtml(react);
  // Default FROM to SMTP_USER to avoid 553 Sender address rejected (e.g. Proton)
  let from = env.EMAIL_FROM || (env.SMTP_USER ? `Moneyger <${env.SMTP_USER}>` : "Moneyger <noreply@moneyger.dev>");
  // Proton and many providers require FROM to match authenticated user
  if (env.SMTP_USER) {
    const fromEmail = extractEmail(from).toLowerCase();
    const smtpUser = env.SMTP_USER.toLowerCase();
    if (fromEmail !== smtpUser) {
      console.warn(`[email] EMAIL_FROM (${fromEmail}) does not match SMTP_USER (${smtpUser}). Many providers (e.g. Proton) will reject with 553. Overriding FROM to SMTP_USER. Set EMAIL_FROM to match SMTP_USER or leave unset.`);
      from = `Moneyger <${env.SMTP_USER}>`;
    }
  }

  // Extract verification/reset URL for fallback logging (used when SMTP fails)
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const urlMatch = html.match(/href="([^"]+)"/);
  const previewUrl = urlMatch ? urlMatch[1] : null;

  const transport = getSmtpTransport();
  if (transport) {
    try {
      const info = await transport.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`[email] Sent to ${to} subject="${subject}" messageId=${(info as unknown as { messageId?: string })?.messageId ?? "unknown"}`);
      if (previewUrl) console.log(`[email] Preview URL: ${previewUrl}`);
      return info;
    } catch (error) {
      console.error("Error sending email via SMTP:", error);
      if (previewUrl) {
        console.error(`[email] SMTP FAILED — manual verification link for ${to}: ${previewUrl}`);
        console.error(`[email] You can manually verify by visiting the link above or running: UPDATE "user" SET email_verified=true WHERE email='${to}'`);
      }
      throw new Error("Failed to send email via SMTP");
    }
  }

  // No email provider configured
  const isDev = env.NODE_ENV !== "production";
  if (isDev) {
    console.warn(
      `[email] No email provider configured (SMTP_HOST). Logging email instead:\nTo: ${to}\nSubject: ${subject}\nHTML preview available.`
    );
    console.log(`[email:dev-preview] To=${to} Subject=${subject} HTML length=${html.length}`);
    if (previewUrl) console.log(`[email:dev-preview] Link: ${previewUrl}`);
    return { devPreview: true, to, subject, previewUrl };
  }

  console.warn("No email provider configured (SMTP_HOST), skipping email sending");
  throw new Error("No email provider configured — set SMTP_HOST and related env vars");
}

export async function sendResetPasswordEmail(
  email: string,
  firstName: string,
  url: string
) {
  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    react: React.createElement(ResetPasswordEmailTemplate, { firstName, url }),
  });
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  url: string
) {
  return sendEmail({
    to: email,
    subject: "Verify Your Email — Moneyger",
    react: React.createElement(VerificationEmailTemplate, { firstName, url }),
  });
}

export function isEmailServiceConfigured(): boolean {
  return !!env.SMTP_HOST;
}
