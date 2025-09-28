const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY || "re_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP");

async function sendEmail({ to, subject, html }) {
  // For testing: only send to registered email address
  const registeredEmail = "i.benyahya1995@gmail.com";
  
  if (to !== registeredEmail) {
    console.log(`⚠️ Resend test mode: redirecting email from ${to} to ${registeredEmail}`);
    to = registeredEmail;
  }
  
  return await resend.emails.send({
    from: "onboarding@resend.dev", // Verified Resend domain for testing
    to,
    subject: `[TEST] ${subject} (Original: ${to})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ff6b6b; color: white; padding: 10px; text-align: center; margin-bottom: 20px;">
          <strong>TEST MODE</strong> - Dit is een test e-mail van Resend
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px;">
          <p><strong>Originele ontvanger:</strong> ${to}</p>
          <p><strong>Test ontvanger:</strong> ${registeredEmail}</p>
        </div>
        ${html}
        <div style="background-color: #e9ecef; padding: 10px; margin-top: 20px; font-size: 12px; color: #6c757d;">
          Dit is een test e-mail van de Chatbox Widget handover systeem.
        </div>
      </div>
    `,
  });
}

module.exports = { sendEmail };
