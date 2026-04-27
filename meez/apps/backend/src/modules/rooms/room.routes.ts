import { Router } from 'express';
import { roomController } from './room.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';

export const roomRoutes = Router();
roomRoutes.use(authenticate);

roomRoutes.get('/availability', asyncHandler(roomController.checkAvailability));
roomRoutes.post('/reserve', asyncHandler(roomController.reserve));
