import { Request, Response } from 'express';
import { transcriptionService } from './transcription.service';
import { sendSuccess } from '../../utils/response';

export class TranscriptionController {
  async getTranscript(req: Request, res: Response) {
    const transcript = await transcriptionService.getTranscript(req.params.meetingId);
    sendSuccess(res, transcript);
  }
}

export const transcriptionController = new TranscriptionController();
