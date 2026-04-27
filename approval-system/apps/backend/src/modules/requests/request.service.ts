import { Prisma, RequestStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_revision: 'نیاز به اصلاح',
};

async function createNotification(userId: string, requestId: string, toStatus: RequestStatus, title: string) {
  const label = STATUS_LABELS[toStatus];
  await prisma.notification.create({
    data: {
      userId,
      requestId,
      message: `وضعیت درخواست «${title}» به «${label}» تغییر کرد`,
    },
  });
}

async function createStatusEvent(
  requestId: string,
  actorId: string,
  fromStatus: RequestStatus | null,
  toStatus: RequestStatus,
  comment?: string,
) {
  await prisma.requestStatusEvent.create({
    data: { requestId, actorId, fromStatus, toStatus, comment },
  });
}

export async function listRequests(
  userId: string,
  role: string,
  filters: { status?: string; employeeId?: string; page: number; limit: number },
) {
  const where: Prisma.RequestWhereInput = {};
  if (role === 'employee') {
    where.createdById = userId;
  } else if (filters.employeeId) {
    where.createdById = filters.employeeId;
  }
  if (filters.status) {
    where.status = filters.status as RequestStatus;
  }

  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { attachments: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.request.count({ where }),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
}

export async function getRequest(requestId: string, userId: string, role: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      attachments: true,
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      statusEvents: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!request) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (role === 'employee' && request.createdById !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'شما دسترسی به این درخواست را ندارید');
  }

  return request;
}

export async function createRequest(userId: string, data: { title: string; description: string; amount?: number | null }) {
  const request = await prisma.request.create({
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount ?? null,
      createdById: userId,
    },
  });
  await createStatusEvent(request.id, userId, null, 'draft');
  return request;
}

export async function updateRequest(requestId: string, userId: string, data: { title?: string; description?: string; amount?: number | null }) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.createdById !== userId) throw new AppError(403, 'FORBIDDEN', 'فقط ایجاد‌کننده می‌تواند پیش‌نویس را ویرایش کند');
  if (existing.status !== 'draft') throw new AppError(400, 'INVALID_STATUS', 'فقط پیش‌نویس‌ها قابل ویرایش هستند');

  return prisma.request.update({ where: { id: requestId }, data });
}

export async function deleteRequest(requestId: string, userId: string) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.createdById !== userId) throw new AppError(403, 'FORBIDDEN', 'فقط ایجاد‌کننده می‌تواند پیش‌نویس را حذف کند');
  if (existing.status !== 'draft') throw new AppError(400, 'INVALID_STATUS', 'فقط پیش‌نویس‌ها قابل حذف هستند');

  await prisma.request.delete({ where: { id: requestId } });
}

export async function submitRequest(requestId: string, userId: string) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.createdById !== userId) throw new AppError(403, 'FORBIDDEN', 'فقط ایجاد‌کننده می‌تواند درخواست را ارسال کند');
  if (existing.status !== 'draft' && existing.status !== 'needs_revision') {
    throw new AppError(400, 'INVALID_STATUS', 'فقط پیش‌نویس‌ها یا درخواست‌های نیاز به اصلاح قابل ارسال هستند');
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'pending' },
  });
  await createStatusEvent(requestId, userId, existing.status, 'pending');
  return updated;
}

export async function approveRequest(requestId: string, managerId: string, comment?: string) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.status !== 'pending') throw new AppError(400, 'INVALID_STATUS', 'فقط درخواست‌های در انتظار بررسی قابل تأیید هستند');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'approved', assignedToId: managerId },
  });
  await createStatusEvent(requestId, managerId, 'pending', 'approved', comment);
  if (comment) {
    await prisma.comment.create({ data: { requestId, authorId: managerId, body: comment } });
  }
  await createNotification(existing.createdById, requestId, 'approved', existing.title);
  return updated;
}

export async function rejectRequest(requestId: string, managerId: string, comment?: string) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.status !== 'pending') throw new AppError(400, 'INVALID_STATUS', 'فقط درخواست‌های در انتظار بررسی قابل رد هستند');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'rejected', assignedToId: managerId },
  });
  await createStatusEvent(requestId, managerId, 'pending', 'rejected', comment);
  if (comment) {
    await prisma.comment.create({ data: { requestId, authorId: managerId, body: comment } });
  }
  await createNotification(existing.createdById, requestId, 'rejected', existing.title);
  return updated;
}

export async function reviseRequest(requestId: string, managerId: string, comment?: string) {
  const existing = await prisma.request.findUnique({ where: { id: requestId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (existing.status !== 'pending') throw new AppError(400, 'INVALID_STATUS', 'فقط درخواست‌های در انتظار بررسی قابل بازگشت هستند');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'needs_revision', assignedToId: managerId },
  });
  await createStatusEvent(requestId, managerId, 'pending', 'needs_revision', comment);
  if (comment) {
    await prisma.comment.create({ data: { requestId, authorId: managerId, body: comment } });
  }
  await createNotification(existing.createdById, requestId, 'needs_revision', existing.title);
  return updated;
}

export async function getMetrics() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [pending, approvedToday, total] = await Promise.all([
    prisma.request.count({ where: { status: 'pending' } }),
    prisma.request.count({ where: { status: 'approved', updatedAt: { gte: startOfDay } } }),
    prisma.request.count(),
  ]);

  return { pending, approvedToday, total };
}
