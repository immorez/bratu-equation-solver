import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId || uuidv4(),
    },
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details },
  });
}
