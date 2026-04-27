import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import * as ctrl from './notification.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/', asyncHandler(ctrl.list));
router.patch('/:id/read', asyncHandler(ctrl.markRead));
router.patch('/read-all', asyncHandler(ctrl.markAllRead));

export default router;
