import { Request, Response } from 'express';
import { roomService } from './room.service';
import { sendSuccess } from '../../utils/response';

export class RoomController {
  async checkAvailability(req: Request, res: Response) {
    const rooms = await roomService.checkAvailability(req.query.date as string);
    sendSuccess(res, rooms);
  }

  async reserve(req: Request, res: Response) {
    const result = await roomService.reserve(req.body.roomId, req.body.meetingId);
    sendSuccess(res, result);
  }
}

export const roomController = new RoomController();
