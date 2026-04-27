import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error-handler';

export interface JwtPayload {
  sub: string;
  role: 'employee' | 'manager';
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: 'employee' | 'manager';
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'ابتدا وارد حساب کاربری شوید');
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;

    const newToken = jwt.sign(
      { sub: payload.sub, role: payload.role },
      env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN },
    );
    res.setHeader('X-Refreshed-Token', newToken);

    next();
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
  }
}

export function requireRole(...roles: Array<'employee' | 'manager'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      throw new AppError(403, 'FORBIDDEN', 'شما دسترسی لازم برای این عملیات را ندارید');
    }
    next();
  };
}
