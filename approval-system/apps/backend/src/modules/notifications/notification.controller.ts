import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';

export async function list(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.userId, isRead: false },
  });

  res.json({ notifications, unreadCount });
}

export async function markRead(req: Request, res: Response) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) throw new AppError(404, 'NOT_FOUND', 'اعلان یافت نشد');
  if (notification.userId !== req.userId) throw new AppError(403, 'FORBIDDEN', 'دسترسی غیرمجاز');

  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.status(204).end();
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });
  res.status(204).end();
}
