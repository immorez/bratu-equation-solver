import { PrismaClient, Role, MeetingStatus, InvitationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.invitation.deleteMany(),
    prisma.document.deleteMany(),
    prisma.transcript.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.meeting.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // Users
  const admin = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@meetai.dev',
      password: hashedPassword,
      role: Role.ADMIN,
      orgId,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'alex@meetai.dev',
      password: hashedPassword,
      role: Role.USER,
      orgId,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'jordan@meetai.dev',
      password: hashedPassword,
      role: Role.USER,
      orgId,
    },
  });

  // Meetings
  const meeting1 = await prisma.meeting.create({
    data: {
      title: 'Q1 Sprint Planning',
      startTime: new Date('2026-03-15T10:00:00Z'),
      endTime: new Date('2026-03-15T11:00:00Z'),
      status: MeetingStatus.PLANNED,
      organizerId: user1.id,
      orgId,
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
          { userId: admin.id },
        ],
      },
      invitations: {
        create: [
          { email: 'jordan@meetai.dev', status: InvitationStatus.ACCEPTED },
          { email: 'external@company.com', status: InvitationStatus.PENDING },
        ],
      },
    },
  });

  const meeting2 = await prisma.meeting.create({
    data: {
      title: 'Design Review: Dashboard v2',
      startTime: new Date('2026-03-16T14:00:00Z'),
      status: MeetingStatus.COMPLETED,
      organizerId: admin.id,
      orgId,
      participants: {
        create: [
          { userId: admin.id, joinedAt: new Date('2026-03-16T14:00:00Z'), leftAt: new Date('2026-03-16T15:30:00Z') },
          { userId: user1.id, joinedAt: new Date('2026-03-16T14:02:00Z'), leftAt: new Date('2026-03-16T15:30:00Z') },
        ],
      },
    },
  });

  // Transcript for completed meeting
  await prisma.transcript.create({
    data: {
      meetingId: meeting2.id,
      chunks: [
        { speaker: 'admin@meetai.dev', text: "Let's review the dashboard wireframes.", timestamp: 0, confidence: 0.96 },
        { speaker: 'alex@meetai.dev', text: 'I think we should use a card-based layout for meetings.', timestamp: 12, confidence: 0.93 },
        { speaker: 'admin@meetai.dev', text: "Agreed. Let's also add filter by status.", timestamp: 28, confidence: 0.95 },
      ],
      insights: {
        notes: ['Card-based layout agreed for meetings view', 'Filter by status to be added'],
        tasks: [
          { description: 'Implement card-based meeting layout', assignee: 'alex@meetai.dev', due: '2026-03-20' },
          { description: 'Add status filter to meetings list', assignee: 'alex@meetai.dev', due: '2026-03-22' },
        ],
        topics: ['Dashboard Design', 'UI Components', 'Meeting List'],
        sentiment: 0.7,
      },
    },
  });

  console.log('Seed complete');
  console.log('  Admin: admin@meetai.dev / Password123!');
  console.log('  User:  alex@meetai.dev  / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
