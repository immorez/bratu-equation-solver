import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { aiRateLimit } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { askSchema } from './ai.schema';
import * as ctrl from './ai.controller';

const router = Router();

router.use(authenticateJWT);

router.post('/:id/ai/insights', aiRateLimit, asyncHandler(ctrl.insights));
router.post('/:id/ai/ask', aiRateLimit, validate(askSchema), asyncHandler(ctrl.ask));

export default router;
