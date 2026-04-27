import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error-handler';

const GENERIC_LOGIN_ERROR = 'ایمیل یا رمز عبور اشتباه است';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw new AppError(401, 'INVALID_CREDENTIALS', GENERIC_LOGIN_ERROR);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', GENERIC_LOGIN_ERROR);
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN },
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'کاربر یافت نشد');
  res.json({ user });
}

export async function logout(_req: Request, res: Response) {
  res.status(204).end();
}
