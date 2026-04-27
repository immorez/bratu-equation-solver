import { Request, Response } from "express";
import { prisma } from "../../config/db";
import { AppError } from "../../middleware/error-handler";
import {
  encryptAndSave,
  decryptStream,
  deleteFile,
} from "../../config/storage";

export async function uploadAttachment(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, "NO_FILE", "فایلی انتخاب نشده است");

  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
  });
  if (!request) throw new AppError(404, "NOT_FOUND", "درخواست یافت نشد");
  if (request.createdById !== req.userId)
    throw new AppError(
      403,
      "FORBIDDEN",
      "فقط ایجاد‌کننده می‌تواند فایل بارگذاری کند",
    );
  if (request.status !== "draft" && request.status !== "needs_revision") {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "بارگذاری فایل فقط در وضعیت پیش‌نویس یا نیاز به اصلاح ممکن است",
    );
  }

  const { filepath, iv, authTag } = await encryptAndSave(
    req.file.buffer,
    req.file.originalname,
  );

  const attachment = await prisma.attachment.create({
    data: {
      requestId: req.params.id,
      filename: req.file.originalname,
      filepath,
      mimetype: req.file.mimetype,
      size: req.file.size,
      iv,
      authTag,
    },
  });

  res.status(201).json(attachment);
}

export async function downloadAttachment(req: Request, res: Response) {
  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
  });
  if (!request) throw new AppError(404, "NOT_FOUND", "درخواست یافت نشد");
  if (req.userRole === "employee" && request.createdById !== req.userId) {
    throw new AppError(403, "FORBIDDEN", "شما دسترسی به این فایل را ندارید");
  }

  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.fid, requestId: req.params.id },
  });
  if (!attachment) throw new AppError(404, "NOT_FOUND", "فایل یافت نشد");

  res.setHeader(
    "Content-Disposition",
    buildContentDisposition(attachment.filename),
  );
  res.setHeader("Content-Type", attachment.mimetype);

  const stream = decryptStream(
    attachment.filepath,
    attachment.iv,
    attachment.authTag,
  );
  stream.pipe(res);
}

// RFC 5987: send an ASCII fallback in `filename=` plus a UTF-8 percent-encoded
// `filename*=` so non-ASCII (e.g. Persian) names survive the network hop.
function buildContentDisposition(filename: string): string {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]+/g, "_")
    .replace(/"/g, "");
  const utf8 = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8}`;
}

export async function deleteAttachment(req: Request, res: Response) {
  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
  });
  if (!request) throw new AppError(404, "NOT_FOUND", "درخواست یافت نشد");
  if (request.createdById !== req.userId)
    throw new AppError(
      403,
      "FORBIDDEN",
      "فقط ایجاد‌کننده می‌تواند فایل را حذف کند",
    );
  if (request.status !== "draft")
    throw new AppError(
      400,
      "INVALID_STATUS",
      "حذف فایل فقط در وضعیت پیش‌نویس ممکن است",
    );

  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.fid, requestId: req.params.id },
  });
  if (!attachment) throw new AppError(404, "NOT_FOUND", "فایل یافت نشد");

  await deleteFile(attachment.filepath);
  await prisma.attachment.delete({ where: { id: attachment.id } });

  res.status(204).end();
}
