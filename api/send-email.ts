import { BrevoClient } from "@getbrevo/brevo";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  const {
    to,
    subject,
    htmlContent,
    sender,
  } = req.body;

  if (!to?.email || !subject || !htmlContent) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: sender ?? {
        email: process.env.BREVO_FROM_EMAIL!,
        name: process.env.BREVO_FROM_NAME!,
      },
      to: [
        {
          email: to.email,
          name: to.name,
        },
      ],
      subject,
      htmlContent,
      textContent: htmlContent.replace(/<[^>]+>/g, ""),
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.body || error.message,
    });
  }
}