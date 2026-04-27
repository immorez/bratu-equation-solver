import { env, validateEnv } from './config/env';
import app from './app';
import { prisma } from './config/db';

async function main() {
  try {
    validateEnv();
  } catch (err) {
    console.error('Environment validation failed:', (err as Error).message);
    process.exit(1);
  }

  await prisma.$connect();
  console.log('Database connected');

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
