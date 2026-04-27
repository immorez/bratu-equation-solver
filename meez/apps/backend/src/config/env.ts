import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGINS: z.string().transform((s) => s.split(',')),
  AI_TRANSCRIPTION_PROVIDER: z.enum(['deepgram', 'assemblyai']).default('deepgram'),
  DEEPGRAM_API_KEY: z.string().optional(),
  ASSEMBLYAI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('meetai-recordings'),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  EMAIL_PROVIDER: z.enum(['nodemailer', 'resend']).default('nodemailer'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
