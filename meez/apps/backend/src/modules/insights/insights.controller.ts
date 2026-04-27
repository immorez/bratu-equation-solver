import { Request, Response } from 'express';
import { insightsService } from './insights.service';
import { sendSuccess } from '../../utils/response';

export class InsightsController {
  async getByMeeting(req: Request, res: Response) {
    const insights = await insightsService.getByMeeting(req.params.meetingId);
    sendSuccess(res, insights);
  }
}

export const insightsController = new InsightsController();
