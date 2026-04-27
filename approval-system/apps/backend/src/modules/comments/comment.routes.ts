import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createCommentSchema } from './comment.schema';
import * as ctrl from './comment.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/:id/comments', asyncHandler(ctrl.list));
router.post('/:id/comments', validate(createCommentSchema), asyncHandler(ctrl.create));

export default router;
