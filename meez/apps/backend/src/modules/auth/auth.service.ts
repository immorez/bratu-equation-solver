import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error-handler.middleware';
import { AuthPayload } from '../../middleware/auth.middleware';

export class AuthService {
  async register(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email already registered', 409, 'CONFLICT');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, role: true, orgId: true },
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, orgId: true },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(userWithoutPassword);
    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, orgId: true },
      });
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
      return this.generateTokens(user);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
  }

  private generateTokens(user: { id: string; email: string; role: string; orgId: string | null }) {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      orgId: user.orgId,
    };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
    return { token, refreshToken };
  }
}

export const authService = new AuthService();
