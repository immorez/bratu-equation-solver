/**
 * Email Service — SendGrid integration for vendor outreach.
 *
 * Sends introduction emails to discovered vendors.
 * Requires SENDGRID_API_KEY and EMAIL_FROM in environment.
 */

import sgMail from "@sendgrid/mail";

const FROM = process.env.EMAIL_FROM || "procurement@yourdomain.com";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Send an email via SendGrid.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SENDGRID_API_KEY not configured" };
  }

  sgMail.setApiKey(apiKey);

  try {
    const [res] = await sgMail.send({
      to: input.to,
      from: FROM,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return {
      success: true,
      messageId: res.headers["x-message-id"] as string | undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Generate a vendor introduction email body.
 */
export function buildIntroductionEmail(params: {
  vendorName: string;
  productCategories: string[];
  companyName?: string;
  customMessage?: string;
}): { subject: string; html: string; text: string } {
  const company = params.companyName || "Our Company";
  const products = params.productCategories.join(", ") || "your products";

  const subject = `Partnership Opportunity - ${company}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
  <p>Dear ${params.vendorName},</p>
  <p>We are ${company}, actively seeking reliable suppliers for <strong>${products}</strong>.</p>
  <p>We discovered your company while researching qualified vendors and are impressed by your offerings.</p>
  <p><strong>Key points:</strong></p>
  <ul>
    <li>Long-term partnership potential</li>
    <li>Regular purchase volumes</li>
    <li>Competitive payment terms</li>
    <li>Growth opportunities</li>
  </ul>
  <p>Would you be interested in receiving our RFQs and establishing a business relationship?</p>
  <p>Best regards,<br>${company}</p>
</body>
</html>`;

  const text = `Dear ${params.vendorName},

We are ${company}, actively seeking reliable suppliers for ${products}.

We discovered your company while researching qualified vendors and are impressed by your offerings.

Key points:
- Long-term partnership potential
- Regular purchase volumes
- Competitive payment terms
- Growth opportunities

Would you be interested in receiving our RFQs and establishing a business relationship?

Best regards,
${company}`;

  return { subject, html, text };
}
