import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler.middleware';

export class DocumentService {
  async upload(data: { meetingId: string; filename: string; originalName: string; mimeType: string; size: number; url: string }, userId: string) {
    return prisma.document.create({
      data: { ...data, uploadedBy: userId },
    });
  }

  async findByMeeting(meetingId: string) {
    return prisma.document.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string, userId: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) throw new AppError('Document not found', 404, 'NOT_FOUND');
    if (doc.uploadedBy !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    await prisma.document.delete({ where: { id } });
  }
}

export const documentService = new DocumentService();
