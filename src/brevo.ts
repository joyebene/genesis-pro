import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

interface EmailRecipient {
    email: string;
    name?: string;
}

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY!,
});

const DEFAULT_SENDER: EmailRecipient = {
    email: process.env.BREVO_FROM_EMAIL!,
    name: process.env.BREVO_FROM_NAME!,
};

export const sendEmail = async (
    to: EmailRecipient,
    subject: string,
    htmlContent: string,
    sender: EmailRecipient = DEFAULT_SENDER
): Promise<boolean> => {
    try {
        await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                email: sender.email,
                name: sender.name,
            },
            to: [
                {
                    email: to.email,
                    name: to.name,
                },
            ],
            subject,
            htmlContent,
            textContent: htmlContent.replace(/<[^>]*>/g, ""),
        });

        console.log("✅ Email sent successfully");
        return true;
    } catch (error: any) {
        console.error("Brevo Error");

        if (error.body) {
            console.error(error.body);
        } else if (error.response) {
            console.error(error.response);
        } else {
            console.error(error);
        }
        return false;
    }
};

/**
 * Sends a welcome email to a new user upon successful signup.
 * @param recipientEmail - The email address of the new user.
 * @param recipientName - The name of the new user.
 */
export const sendWelcomeEmail = async (recipientEmail: string, recipientName: string) => {
    const subject = "Welcome to GenesisPro!";
    const htmlContent = `
    <html>
      <body>
        <p>Hello ${recipientName},</p>
        <p>Welcome to GenesisPro! We're excited to have you on board.</p>
        <p>You can now log in to your dashboard and start managing your investments.</p>
        <p>Best regards,</p>
        <p>The GenesisPro Team</p>
      </body>
    </html>
  `;
    return sendEmail({ email: recipientEmail, name: recipientName }, subject, htmlContent);
};

/**
 * Sends an email notification to the user when they report a payment.
 * @param recipientEmail - The email address of the user.
 * @param recipientName - The name of the user.
 * @param amount - The amount of the payment.
 * @param coin - The cryptocurrency used for payment.
 */
export const sendPaymentReportEmail = async (recipientEmail: string, recipientName: string, amount: number, coin: string) => {
    const subject = "Payment Received - Processing Your Deposit";
    const htmlContent = `
    <html>
      <body>
        <p>Hello ${recipientName},</p>
        <p>Thank you for your payment of ${amount} ${coin}.</p>
        <p>We have received your payment notification and are now processing your deposit. This may take some time to confirm on the blockchain.</p>
        <p>You will receive another email once your payment has been confirmed and your balance updated.</p>
        <p>Best regards,</p>
        <p>The GenesisPro Team</p>
      </body>
    </html>
  `;
    return sendEmail({ email: recipientEmail, name: recipientName }, subject, htmlContent);
};

/**
 * Sends an email notification to the admin when a user reports a payment.
 * @param clientName - The name of the client who made the payment.
 * @param clientEmail - The email of the client who made the payment.
 * @param amount - The amount of the payment.
 * @param coin - The cryptocurrency used for payment.
 */
export const sendAdminPaymentNotificationEmail = async (clientName: string, clientEmail: string, amount: number, coin: string) => {
    const adminEmail = "admin@genesisprohub.com";
    const subject = `New Payment Reported by ${clientName}`;
    const htmlContent = `
    <html>
      <body>
        <p>Hello Admin,</p>
        <p>A new payment has been reported by ${clientName} (${clientEmail}).</p>
        <p>Details:</p>
        <ul>
          <li>Amount: ${amount} ${coin}</li>
          <li>Client Email: ${clientEmail}</li>
        </ul>
        <p>Please log in to the admin dashboard to verify and confirm the payment.</p>
        <p>Best regards,</p>
        <p>GenesisPro System</p>
      </body>
    </html>
  `;
    return sendEmail({ email: adminEmail, name: "Admin" }, subject, htmlContent);
};

/**
 * Sends an email notification to the user when their payment is confirmed.
 * @param recipientEmail - The email address of the user.
 * @param recipientName - The name of the user.
 * @param amount - The confirmed amount.
 * @param newBalance - The user's new balance.
 */
export const sendPaymentConfirmedEmail = async (recipientEmail: string, recipientName: string, amount: number, newBalance: number) => {
    const subject = "Your Payment Has Been Confirmed!";
    const htmlContent = `
    <html>
      <body>
        <p>Hello ${recipientName},</p>
        <p>Good news! Your payment of ${amount} has been successfully confirmed.</p>
        <p>Your new account balance is: ${newBalance}.</p>
        <p>You can view your updated balance and transaction history in your dashboard.</p>
        <p>Best regards,</p>
        <p>The GenesisPro Team</p>
      </body>
    </html>
  `;
    return sendEmail({ email: recipientEmail, name: recipientName }, subject, htmlContent);
};