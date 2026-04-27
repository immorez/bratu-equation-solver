import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    sendSuccess(res, result, 201);
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
  }

  async me(req: Request, res: Response) {
    sendSuccess(res, { user: req.user });
  }
}

export const authController = new AuthController();
