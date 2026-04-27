import { Request, Response } from 'express';
import * as service from './request.service';

export async function list(req: Request, res: Response) {
  const result = await service.listRequests(req.userId!, req.userRole!, req.query as any);
  res.json(result);
}

export async function detail(req: Request, res: Response) {
  const result = await service.getRequest(req.params.id, req.userId!, req.userRole!);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const result = await service.createRequest(req.userId!, req.body);
  res.status(201).json(result);
}

export async function update(req: Request, res: Response) {
  const result = await service.updateRequest(req.params.id, req.userId!, req.body);
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  await service.deleteRequest(req.params.id, req.userId!);
  res.status(204).end();
}

export async function submit(req: Request, res: Response) {
  const result = await service.submitRequest(req.params.id, req.userId!);
  res.json(result);
}

export async function approve(req: Request, res: Response) {
  const result = await service.approveRequest(req.params.id, req.userId!, req.body.comment);
  res.json(result);
}

export async function reject(req: Request, res: Response) {
  const result = await service.rejectRequest(req.params.id, req.userId!, req.body.comment);
  res.json(result);
}

export async function revise(req: Request, res: Response) {
  const result = await service.reviseRequest(req.params.id, req.userId!, req.body.comment);
  res.json(result);
}

export async function metrics(_req: Request, res: Response) {
  const result = await service.getMetrics();
  res.json(result);
}
