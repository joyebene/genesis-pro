import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Configure Brevo API key
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailPayload {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  sender?: EmailRecipient;
}

export default async function (request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  const { to, subject, htmlContent, sender }: SendEmailPayload = request.body;

  if (!to || !to.email || !subject || !htmlContent) {
    return response.status(400).json({ error: 'Missing required email parameters.' });
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = sender || { email: "no-reply@genesispro.com", name: "GenesisPro" };
  sendSmtpEmail.to = [to];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo API called successfully. Returned data: ' + JSON.stringify(data));
    return response.status(200).json({ message: 'Email sent successfully', data });
  } catch (error: any) {
    console.error('Error sending email via Brevo API:', error.response ? error.response.text : error);
    return response.status(500).json({ error: 'Failed to send email', details: error.response ? error.response.text : error.message });
  }
}