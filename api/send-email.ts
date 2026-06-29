import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  console.error("BREVO_API_KEY is not set in environment variables");
}

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = apiKey;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, htmlContent, sender } = req.body;

  if (!to?.email || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      sender: sender || { email: "noreply@unimartapp.acelinebrand.com", name: "Unimart" },
      to: [to],
      subject,
      htmlContent,
    });

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    return res.status(200).json({ message: 'Email sent successfully', data });
  } catch (error: any) {
    console.error('Brevo Error:', error?.response?.text || error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error?.response?.text || error.message 
    });
  }
}