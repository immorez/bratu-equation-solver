import { z } from 'zod';

export const TranscriptChunkSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  timestamp: z.number(),
  confidence: z.number().min(0).max(1),
});

export const InsightTaskSchema = z.object({
  description: z.string(),
  assignee: z.string().optional(),
  due: z.string().optional(),
});

export const InsightsSchema = z.object({
  notes: z.array(z.string()),
  tasks: z.array(InsightTaskSchema),
  topics: z.array(z.string()),
  sentiment: z.number().min(-1).max(1),
});

export type TranscriptChunkInput = z.infer<typeof TranscriptChunkSchema>;
export type InsightTaskInput = z.infer<typeof InsightTaskSchema>;
export type InsightsInput = z.infer<typeof InsightsSchema>;
