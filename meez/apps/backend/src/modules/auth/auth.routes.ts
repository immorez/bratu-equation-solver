import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '@meetai/shared';

export const authRoutes = Router();

authRoutes.post('/register', validate(RegisterSchema), asyncHandler(authController.register));
authRoutes.post('/login', validate(LoginSchema), asyncHandler(authController.login));
authRoutes.post('/refresh', validate(RefreshTokenSchema), asyncHandler(authController.refresh));
authRoutes.get('/me', authenticate, asyncHandler(authController.me));
