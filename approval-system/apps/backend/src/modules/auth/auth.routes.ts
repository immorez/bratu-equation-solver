import { Router } from 'express';
import { loginRateLimit } from '../../middleware/rate-limit';
import { authenticateJWT } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { login, me, logout } from './auth.controller';
import { loginSchema } from './auth.schema';

const router = Router();

router.post('/login', loginRateLimit, validate(loginSchema), asyncHandler(login));
router.get('/me', authenticateJWT, asyncHandler(me));
router.post('/logout', authenticateJWT, asyncHandler(logout));

export default router;
