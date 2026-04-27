import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createUserSchema, updateUserSchema } from './user.schema';
import * as ctrl from './user.controller';

const router = Router();

router.use(authenticateJWT, requireRole('manager'));

router.get('/', asyncHandler(ctrl.list));
router.post('/', validate(createUserSchema), asyncHandler(ctrl.create));
router.patch('/:id', validate(updateUserSchema), asyncHandler(ctrl.update));

export default router;
