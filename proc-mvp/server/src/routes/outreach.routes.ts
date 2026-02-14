/**
 * Outreach API — contact extraction, email, WhatsApp.
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import {
  extractContactsForResult,
  sendOutreach,
} from "../services/outreach.service.js";
import { isEmailConfigured } from "../services/email.service.js";
import { isWhatsAppConfigured } from "../services/whatsapp.service.js";

export const outreachRouter = Router();
outreachRouter.use(authenticate);

// ─── Status ────────────────────────────────────────────────────

/** GET /api/outreach/status — capabilities */
outreachRouter.get("/status", (_req, res) => {
  res.json({
    email: isEmailConfigured(),
    whatsapp: isWhatsAppConfigured(),
  });
});

// ─── Contact Extraction ────────────────────────────────────────

/** POST /api/outreach/extract-contacts — extract from discovery result website */
outreachRouter.post("/extract-contacts", async (req, res) => {
  const { resultId } = req.body;
  if (!resultId || typeof resultId !== "string") {
    throw new AppError(400, "resultId required");
  }
  const result = await extractContactsForResult({ resultId });
  res.json(result);
});

// ─── Send Outreach ──────────────────────────────────────────────

/** POST /api/outreach/send — send email or WhatsApp */
outreachRouter.post("/send", async (req, res) => {
  const schema = req.body as {
    vendorId?: string;
    resultId?: string;
    channel?: string;
    recipient?: string;
    customMessage?: string;
  };

  if (!schema.vendorId && !schema.resultId) {
    throw new AppError(400, "vendorId or resultId required");
  }
  if (!schema.channel || !["email", "whatsapp"].includes(schema.channel)) {
    throw new AppError(400, "channel must be 'email' or 'whatsapp'");
  }

  const result = await sendOutreach({
    vendorId: schema.vendorId,
    resultId: schema.resultId,
    channel: schema.channel as "email" | "whatsapp",
    recipient: schema.recipient,
    customMessage: schema.customMessage,
  });

  if (!result.success) {
    throw new AppError(400, result.error ?? "Outreach failed");
  }

  res.json(result);
});
