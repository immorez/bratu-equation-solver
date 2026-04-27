import { Request, Response } from 'express';
import { meetingService } from './meeting.service';
import { sendSuccess } from '../../utils/response';

export class MeetingController {
  async create(req: Request, res: Response) {
    const meeting = await meetingService.create(req.body, req.user!.userId, req.user!.orgId);
    sendSuccess(res, meeting, 201);
  }

  async findAll(req: Request, res: Response) {
    const filters = {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };
    const result = await meetingService.findAll(filters, req.user!.userId);
    sendSuccess(res, result);
  }

  async findById(req: Request, res: Response) {
    const meeting = await meetingService.findById(req.params.id, req.user!.userId);
    sendSuccess(res, meeting);
  }

  async update(req: Request, res: Response) {
    const meeting = await meetingService.update(req.params.id, req.body, req.user!.userId);
    sendSuccess(res, meeting);
  }

  async delete(req: Request, res: Response) {
    await meetingService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, { message: 'Meeting deleted' });
  }
}

export const meetingController = new MeetingController();
