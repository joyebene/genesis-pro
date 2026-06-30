import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

const sendEmail = async () => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: "Test Email from GenesisPro",
      sender: {
        name: "GenesisPro Ltd",
        email: "info@genesisprohub.com",
      },
      to: [
        {
          email: "joyebene153@gmail.com",
          name: "Joy Ebene",
        },
      ],
      textContent:
        "This is a test email sent using the new Brevo SDK.",
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Hello Joy 👋</h2>

            <p>This email was sent using the new Brevo SDK.</p>

            <p>If you received this email, everything is configured correctly.</p>

            <br/>

            <strong>GenesisPro Ltd</strong>
          </body>
        </html>
      `,
    });

    console.log("✅ Email sent successfully!");
  } catch (error: any) {
    console.error("❌ Failed to send email");

    if (error.response) {
      console.error(error.response.data ?? error.response);
    } else {
      console.error(error);
    }
  }
};

sendEmail();