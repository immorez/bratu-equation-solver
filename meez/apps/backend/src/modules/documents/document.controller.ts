import { Request, Response } from 'express';
import { documentService } from './document.service';
import { sendSuccess } from '../../utils/response';

export class DocumentController {
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }
    const doc = await documentService.upload(
      {
        meetingId: req.params.meetingId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
      },
      req.user!.userId,
    );
    sendSuccess(res, doc, 201);
  }

  async findByMeeting(req: Request, res: Response) {
    const docs = await documentService.findByMeeting(req.params.meetingId);
    sendSuccess(res, docs);
  }

  async delete(req: Request, res: Response) {
    await documentService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, { message: 'Document deleted' });
  }
}

export const documentController = new DocumentController();
