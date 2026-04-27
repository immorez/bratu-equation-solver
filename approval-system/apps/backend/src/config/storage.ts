import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from './env';

function getEncryptionKey(): Buffer {
  const hex = env.FILE_ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    if (env.NODE_ENV === 'production') {
      throw new Error('FILE_ENCRYPTION_KEY must be set in production');
    }
    return crypto.createHash('sha256').update('dev-only-key').digest();
  }
  return Buffer.from(hex, 'hex');
}

export async function encryptAndSave(buffer: Buffer, filename: string): Promise<{ filepath: string; iv: string; authTag: string }> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const safeName = `${crypto.randomUUID()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filepath = path.join(env.UPLOAD_DIR, safeName);

  await fs.promises.mkdir(env.UPLOAD_DIR, { recursive: true });
  await fs.promises.writeFile(filepath, encrypted);

  return {
    filepath: safeName,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptStream(filepath: string, ivHex: string, authTagHex: string): NodeJS.ReadableStream {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const fullPath = path.join(env.UPLOAD_DIR, filepath);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const fileStream = fs.createReadStream(fullPath);
  return fileStream.pipe(decipher);
}

export async function deleteFile(filepath: string): Promise<void> {
  const fullPath = path.join(env.UPLOAD_DIR, filepath);
  await fs.promises.unlink(fullPath).catch(() => {});
}
