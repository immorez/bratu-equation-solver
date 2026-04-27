import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 50 * 1024 * 1024 } });

export const documentRoutes = Router();
documentRoutes.use(authenticate);

documentRoutes.post('/:meetingId', upload.single('file'), asyncHandler(documentController.upload));
documentRoutes.get('/:meetingId', asyncHandler(documentController.findByMeeting));
documentRoutes.delete('/:id', asyncHandler(documentController.delete));
