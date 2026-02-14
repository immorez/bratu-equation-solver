/**
 * WhatsApp Service — Twilio integration for vendor outreach.
 *
 * Sends WhatsApp messages to discovered vendors.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 *
 * Note: Business-initiated messages require pre-approved templates.
 * Use TWILIO_WHATSAPP_TEMPLATE_SID for template-based outreach.
 */

import twilio from "twilio";

export interface SendWhatsAppInput {
  to: string; // E.164 format, e.g. +1234567890
  body?: string; // Free-form (only within 24h customer service window)
  templateSid?: string;
  templateVariables?: Record<string, string>;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

function getClient(): twilio.Twilio | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

/**
 * Normalize phone to E.164 for WhatsApp.
 * Assumes country code if not present (default +1 for US).
 */
export function normalizePhoneForWhatsApp(
  phone: string,
  defaultCountryCode = "1",
): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && defaultCountryCode === "1") {
    digits = "1" + digits;
  } else if (digits.length < 11 && !digits.startsWith("1")) {
    digits = defaultCountryCode + digits;
  }
  return `+${digits}`;
}

/**
 * Send a WhatsApp message via Twilio.
 *
 * For cold outreach (business-initiated), use templateSid + templateVariables.
 * For replies within 24h of user message, use body for free-form text.
 */
export async function sendWhatsApp(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!client || !from) {
    return { success: false, error: "WhatsApp not configured (Twilio)" };
  }

  const to = input.to.startsWith("whatsapp:") ? input.to : `whatsapp:${input.to}`;
  const fromWa = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  try {
    const params: {
      from: string;
      to: string;
      body?: string;
      contentSid?: string;
      contentVariables?: string;
    } = {
      from: fromWa,
      to,
    };

    if (input.templateSid) {
      params.contentSid = input.templateSid;
      if (input.templateVariables) {
        params.contentVariables = JSON.stringify(input.templateVariables);
      }
    } else if (input.body) {
      params.body = input.body;
    } else {
      return { success: false, error: "Either body or templateSid required" };
    }

    const message = await client.messages.create(params);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Build a simple introduction message for WhatsApp.
 */
export function buildIntroductionMessage(params: {
  vendorName: string;
  productCategories: string[];
  companyName?: string;
}): string {
  const company = params.companyName || "Our Company";
  const products = params.productCategories.join(", ") || "your products";

  return `Hello ${params.vendorName},

We are ${company}, seeking reliable suppliers for ${products}.

We discovered your company and would like to explore a partnership. Interested in receiving our RFQs?

Best regards,
${company}`;
}
