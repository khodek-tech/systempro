/**
 * Server-side AES-256-GCM encryption for email account passwords.
 * NEVER import this file on the client side.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

function getEncryptionKey(): Buffer {
  const key = process.env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('EMAIL_ENCRYPTION_KEY environment variable is not set');
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }
  return buf;
}

export function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
