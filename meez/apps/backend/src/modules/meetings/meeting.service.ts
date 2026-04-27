import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error-handler.middleware';
import { MeetingStatus } from '@prisma/client';

export class MeetingService {
  async create(data: { title: string; description?: string; startTime: string; endTime?: string }, userId: string, orgId?: string | null) {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        organizerId: userId,
        orgId: orgId || undefined,
        participants: {
          create: [{ userId }],
        },
      },
      include: {
        organizer: { select: { id: true, email: true } },
        participants: true,
      },
    });
    return meeting;
  }

  async findAll(filters: { status?: string; search?: string; page: number; limit: number }, userId: string) {
    const where: any = {
      OR: [
        { organizerId: userId },
        { participants: { some: { userId } } },
      ],
    };

    if (filters.status) {
      where.status = filters.status as MeetingStatus;
    }

    if (filters.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          organizer: { select: { id: true, email: true } },
          participants: true,
          transcript: { select: { id: true, meetingId: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return { meetings, total };
  }

  async findById(id: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, email: true } },
        participants: { include: { user: { select: { id: true, email: true } } } },
        transcript: true,
        documents: true,
        invitations: true,
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404, 'NOT_FOUND');
    }

    return meeting;
  }

  async update(id: string, data: { title?: string; description?: string; startTime?: string; endTime?: string; status?: string }, userId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      throw new AppError('Meeting not found', 404, 'NOT_FOUND');
    }
    if (meeting.organizerId !== userId) {
      throw new AppError('Only the organizer can update this meeting', 403, 'FORBIDDEN');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.status) updateData.status = data.status as MeetingStatus;

    return prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        organizer: { select: { id: true, email: true } },
        participants: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      throw new AppError('Meeting not found', 404, 'NOT_FOUND');
    }
    if (meeting.organizerId !== userId) {
      throw new AppError('Only the organizer can delete this meeting', 403, 'FORBIDDEN');
    }
    await prisma.meeting.delete({ where: { id } });
  }
}

export const meetingService = new MeetingService();
