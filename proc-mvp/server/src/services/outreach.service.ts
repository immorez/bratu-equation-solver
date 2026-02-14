/**
 * Outreach Service — orchestrate contact extraction, email, and WhatsApp.
 *
 * 1. Extract contacts from vendor website when missing
 * 2. Send introduction email via SendGrid
 * 3. Send introduction WhatsApp via Twilio
 * 4. Record communications in the database
 */

import { prisma } from "../lib/prisma.js";
import {
  extractContactsFromWebsite,
  type ExtractedContacts,
} from "./contact-extractor.service.js";
import {
  sendEmail,
  buildIntroductionEmail,
  isEmailConfigured,
} from "./email.service.js";
import {
  sendWhatsApp,
  buildIntroductionMessage,
  normalizePhoneForWhatsApp,
  isWhatsAppConfigured,
} from "./whatsapp.service.js";

export interface ExtractContactsForResultInput {
  resultId: string;
}

export interface ExtractContactsForResultOutput {
  resultId: string;
  emails: string[];
  phones: string[];
  updated: boolean;
}

/**
 * Extract contacts from a discovery result's website when email/phone are missing.
 * Updates the discovery result with found contacts (stored in rawData for now;
 * on import they become VendorContacts).
 */
export async function extractContactsForResult(
  input: ExtractContactsForResultInput,
): Promise<ExtractContactsForResultOutput> {
  const result = await prisma.discoveryResult.findUnique({
    where: { id: input.resultId },
  });

  if (!result) throw new Error("Discovery result not found");
  if (!result.website) {
    return {
      resultId: input.resultId,
      emails: result.email ? [result.email] : [],
      phones: result.phone ? [result.phone] : [],
      updated: false,
    };
  }

  const hasEmail = !!result.email;
  const hasPhone = !!result.phone;
  if (hasEmail && hasPhone) {
    return {
      resultId: input.resultId,
      emails: [result.email!],
      phones: [result.phone!],
      updated: false,
    };
  }

  const extracted = await extractContactsFromWebsite(result.website);

  const emails = hasEmail ? [result.email!] : extracted.emails;
  const phones = hasPhone ? [result.phone!] : extracted.phones;

  // Update discovery result with extracted contacts
  if ((!hasEmail && extracted.emails.length > 0) || (!hasPhone && extracted.phones.length > 0)) {
    await prisma.discoveryResult.update({
      where: { id: input.resultId },
      data: {
        email: emails[0] ?? result.email,
        phone: phones[0] ?? result.phone,
        rawData: {
          ...((result.rawData as object) || {}),
          extractedEmails: extracted.emails,
          extractedPhones: extracted.phones,
        },
      },
    });
  }

  return {
    resultId: input.resultId,
    emails,
    phones,
    updated: !hasEmail || !hasPhone,
  };
}

export interface SendOutreachInput {
  /** Vendor ID (imported) or DiscoveryResult ID (not yet imported) */
  vendorId?: string;
  resultId?: string;
  channel: "email" | "whatsapp";
  /** Override recipient (email or phone) */
  recipient?: string;
  /** Custom message (optional) */
  customMessage?: string;
}

export interface SendOutreachOutput {
  success: boolean;
  communicationId?: string;
  error?: string;
}

/**
 * Send outreach (email or WhatsApp) to a vendor or discovery result.
 */
export async function sendOutreach(
  input: SendOutreachInput,
): Promise<SendOutreachOutput> {
  let companyName: string;
  let productCategories: string[];
  let email: string | null = null;
  let phone: string | null = null;
  let vendorId: string | null = null;

  if (input.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: input.vendorId },
      include: { contacts: true, products: true },
    });
    if (!vendor) throw new Error("Vendor not found");
    companyName = vendor.companyName;
    productCategories = vendor.products.map((p) => p.productCategory);
    vendorId = vendor.id;
    const emailContact = vendor.contacts.find((c) => c.type === "email");
    const phoneContact = vendor.contacts.find((c) => c.type === "phone");
    email = emailContact?.value ?? null;
    phone = phoneContact?.value ?? null;
  } else if (input.resultId) {
    const result = await prisma.discoveryResult.findUnique({
      where: { id: input.resultId },
    });
    if (!result) throw new Error("Discovery result not found");
    companyName = result.companyName;
    productCategories = result.productCategories;
    email = result.email;
    phone = result.phone;
    vendorId = result.vendorId;
  } else {
    throw new Error("Either vendorId or resultId required");
  }

  const companyNameEnv = process.env.COMPANY_NAME || "ProcMVP";

  if (input.channel === "email") {
    if (!isEmailConfigured()) {
      return { success: false, error: "Email (SendGrid) not configured" };
    }
    const to = input.recipient ?? email;
    if (!to) {
      return { success: false, error: "No email address for this vendor" };
    }

    const { subject, html, text } = buildIntroductionEmail({
      vendorName: companyName,
      productCategories,
      companyName: companyNameEnv,
      customMessage: input.customMessage,
    });

    const sendResult = await sendEmail({ to, subject, html, text });
    if (!sendResult.success) {
      return { success: false, error: sendResult.error };
    }

    const comm = await prisma.communication.create({
      data: {
        vendorId: vendorId!,
        type: "EMAIL",
        subject,
        content: html,
        recipient: to,
      },
    });

    if (vendorId) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: "CONTACTED", lastContact: new Date() },
      });
    }

    return {
      success: true,
      communicationId: comm.id,
    };
  }

  if (input.channel === "whatsapp") {
    if (!isWhatsAppConfigured()) {
      return { success: false, error: "WhatsApp (Twilio) not configured" };
    }
    const rawPhone = input.recipient ?? phone;
    if (!rawPhone) {
      return { success: false, error: "No phone number for this vendor" };
    }

    const to = normalizePhoneForWhatsApp(rawPhone);
    const body = buildIntroductionMessage({
      vendorName: companyName,
      productCategories,
      companyName: companyNameEnv,
    });

    const sendResult = await sendWhatsApp({
      to,
      body: input.customMessage ?? body,
    });

    if (!sendResult.success) {
      return { success: false, error: sendResult.error };
    }

    if (vendorId) {
      const comm = await prisma.communication.create({
        data: {
          vendorId,
          type: "WHATSAPP",
          content: input.customMessage ?? body,
          recipient: to,
        },
      });

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: "CONTACTED", lastContact: new Date() },
      });

      return {
        success: true,
        communicationId: comm.id,
      };
    }

    // Discovery result not yet imported — sent successfully but no Communication record
    return { success: true };
  }

  return { success: false, error: "Invalid channel" };
}
