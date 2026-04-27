import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createRequestSchema, updateRequestSchema, workflowCommentSchema, listRequestsQuery } from './request.schema';
import * as ctrl from './request.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/', validate(listRequestsQuery, 'query'), asyncHandler(ctrl.list));
router.get('/metrics', requireRole('manager'), asyncHandler(ctrl.metrics));
router.post('/', requireRole('employee'), validate(createRequestSchema), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.detail));
router.patch('/:id', requireRole('employee'), validate(updateRequestSchema), asyncHandler(ctrl.update));
router.delete('/:id', requireRole('employee'), asyncHandler(ctrl.remove));

router.post('/:id/submit', requireRole('employee'), asyncHandler(ctrl.submit));
router.post('/:id/approve', requireRole('manager'), validate(workflowCommentSchema), asyncHandler(ctrl.approve));
router.post('/:id/reject', requireRole('manager'), validate(workflowCommentSchema), asyncHandler(ctrl.reject));
router.post('/:id/revise', requireRole('manager'), validate(workflowCommentSchema), asyncHandler(ctrl.revise));

export default router;
