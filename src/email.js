import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function sendViaResend({ subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_TO;

  if (!apiKey || apiKey.includes("your_resend_api_key_here")) {
    return { skipped: true, reason: "RESEND_API_KEY not configured" };
  }
  if (!from || !to) {
    return { skipped: true, reason: "RESEND_FROM or RESEND_TO not configured" };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return { sent: true, id: data?.id, transport: "resend" };
}

export async function sendViaGmail({ subject, html, text }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const to = process.env.RESEND_TO;

  if (!user || !pass) {
    return { skipped: true, reason: "GMAIL_USER or GMAIL_PASS not configured" };
  }
  if (!to) {
    return { skipped: true, reason: "RESEND_TO (recipient) not configured" };
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  const info = await transport.sendMail({
    from: user,
    to,
    subject,
    html,
    text
  });

  return { sent: true, id: info.messageId, transport: "gmail" };
}

export async function sendBriefingEmail({ subject, html, text }) {
  const results = [];
  results.push({ transport: "resend", ...(await sendViaResend({ subject, html, text }).catch((e) => ({ error: e.message }))) });
  results.push({ transport: "gmail", ...(await sendViaGmail({ subject, html, text }).catch((e) => ({ error: e.message }))) });
  return results;
}
