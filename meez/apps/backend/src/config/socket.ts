import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';
import { AuthPayload } from '../middleware/auth.middleware';
import { transcriptionGateway } from '../modules/transcription/transcription.gateway';

let io: Server;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware for sockets
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('UNAUTHORIZED'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    logger.info({ userId: user.userId, socketId: socket.id }, 'Socket connected');

    // Join user personal room
    socket.join(`user:${user.userId}`);

    // Register transcription handlers
    transcriptionGateway.register(io, socket, user);

    socket.on('join-meeting', (meetingId: string) => {
      socket.join(`meeting:${meetingId}`);
      logger.info({ userId: user.userId, meetingId }, 'Joined meeting room');
      socket.to(`meeting:${meetingId}`).emit('participant-joined', {
        userId: user.userId,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(`meeting:${meetingId}`);
      socket.to(`meeting:${meetingId}`).emit('participant-left', {
        userId: user.userId,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info({ userId: user.userId, reason }, 'Socket disconnected');
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
