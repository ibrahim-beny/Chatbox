import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP");

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return await resend.emails.send({
    from: "onboarding@resend.dev", // Verified Resend domain for testing
    to,
    subject,
    html,
  });
}