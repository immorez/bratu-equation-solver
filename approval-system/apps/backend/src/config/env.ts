import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function validateSecrets() {
  if (env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  if (env.NODE_ENV === "production") {
    if (!env.FILE_ENCRYPTION_KEY || env.FILE_ENCRYPTION_KEY.length < 64) {
      throw new Error(
        "FILE_ENCRYPTION_KEY must be a 32-byte hex string (64 chars) in production",
      );
    }
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3002", 10),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  FILE_ENCRYPTION_KEY: process.env.FILE_ENCRYPTION_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  AI_ENABLED:
    process.env.AI_ENABLED === "true" && !!process.env.OPENROUTER_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
  OPENROUTER_HTTP_REFERER: process.env.OPENROUTER_HTTP_REFERER || "",
  OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME || "ApprovalSystem",
  TZ: process.env.TZ || "Asia/Tehran",
};

export function validateEnv() {
  validateSecrets();
}
