import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });
const SENDER_EMAIL = "info@genesisprohub.com"; // Your sender email
const SENDER_NAME = "Genesisproltd";
const RECIPIENT_EMAIL = "joyebene153@gmail.com"; // <<< IMPORTANT: Change this to your actual email address
const RECIPIENT_NAME = "Test User";
const SUBJECT = "Local Test Email from GenesisPro";
const HTML_CONTENT = `
  <html>
    <body>
      <p>Hello ${RECIPIENT_NAME},</p>
      <p>This is a test email sent directly from a local script using the Brevo SDK.</p>
      <p>If you received this, your Brevo API key and SDK setup are likely correct!</p>
      <p>Best regards,</p>
      <p>The GenesisPro Team</p>
    </body>
  </html>
`;
async function sendTestEmail() {
    const ApiClient = SibApiV3Sdk.ApiClient;
    const TransactionalEmailsApi = SibApiV3Sdk.TransactionalEmailsApi;
    const SendSmtpEmail = SibApiV3Sdk.SendSmtpEmail;
    const defaultClient = ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY; // Ensure BREVO_API_KEY is set in your .env
    if (!apiKey.apiKey) {
        console.error("Error: BREVO_API_KEY is not set in your .env file or environment variables.");
        return;
    }
    const apiInstance = new TransactionalEmailsApi();
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: RECIPIENT_EMAIL, name: RECIPIENT_NAME }];
    sendSmtpEmail.subject = SUBJECT;
    sendSmtpEmail.htmlContent = HTML_CONTENT;
    try {
        console.log(`Attempting to send test email to ${RECIPIENT_EMAIL}...`);
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', data);
    }
    catch (error) {
        console.error('Failed to send email:', error.response?.text || error.message);
    }
}
sendTestEmail();
