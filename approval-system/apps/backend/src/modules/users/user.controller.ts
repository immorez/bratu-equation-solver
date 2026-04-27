import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler';

export async function list(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}

export async function create(req: Request, res: Response) {
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) throw new AppError(409, 'DUPLICATE_EMAIL', 'این ایمیل قبلاً ثبت شده است');

  const hash = await bcrypt.hash(req.body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      passwordHash: hash,
      role: req.body.role || 'employee',
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  res.status(201).json(user);
}

export async function update(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'کاربر یافت نشد');

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  res.json(updated);
}
