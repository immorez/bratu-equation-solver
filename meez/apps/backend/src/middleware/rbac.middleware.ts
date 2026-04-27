import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response';

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }
    next();
  };
}
