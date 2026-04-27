import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';

export async function list(req: Request, res: Response) {
  const request = await prisma.request.findUnique({ where: { id: req.params.id } });
  if (!request) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (req.userRole === 'employee' && request.createdById !== req.userId) {
    throw new AppError(403, 'FORBIDDEN', 'شما دسترسی به نظرات این درخواست را ندارید');
  }

  const comments = await prisma.comment.findMany({
    where: { requestId: req.params.id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(comments);
}

export async function create(req: Request, res: Response) {
  const request = await prisma.request.findUnique({ where: { id: req.params.id } });
  if (!request) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');

  if (req.userRole === 'employee') {
    if (request.createdById !== req.userId) {
      throw new AppError(403, 'FORBIDDEN', 'شما دسترسی به این درخواست را ندارید');
    }
    if (request.status === 'needs_revision') {
      const existingReplies = await prisma.comment.count({
        where: {
          requestId: req.params.id,
          authorId: req.userId,
          createdAt: {
            gte: await getLastRevisionDate(req.params.id),
          },
        },
      });
      if (existingReplies >= 1) {
        throw new AppError(400, 'REPLY_LIMIT', 'شما قبلاً به این درخواست اصلاح پاسخ داده‌اید');
      }
    }
  }

  const comment = await prisma.comment.create({
    data: {
      requestId: req.params.id,
      authorId: req.userId!,
      body: req.body.body,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  res.status(201).json(comment);
}

async function getLastRevisionDate(requestId: string): Promise<Date> {
  const event = await prisma.requestStatusEvent.findFirst({
    where: { requestId, toStatus: 'needs_revision' },
    orderBy: { createdAt: 'desc' },
  });
  return event?.createdAt ?? new Date(0);
}
