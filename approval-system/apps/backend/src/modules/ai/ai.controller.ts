import { Request, Response } from 'express';
import * as service from './ai.service';

export async function insights(req: Request, res: Response) {
  const result = await service.generateInsights(req.params.id, req.userId!, req.userRole!);
  res.json(result);
}

export async function ask(req: Request, res: Response) {
  const result = await service.askQuestion(req.params.id, req.userId!, req.userRole!, req.body.question);
  res.json(result);
}
