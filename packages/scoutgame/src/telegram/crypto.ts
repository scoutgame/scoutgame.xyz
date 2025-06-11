import crypto from 'node:crypto';

function convertTo256BitKey(inputKey: string) {
  return crypto.createHash('sha256').update(inputKey).digest();
}

export function encrypt(data: string, key: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    convertTo256BitKey(key) as unknown as crypto.BinaryLike,
    iv as unknown as crypto.BinaryLike
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(data: string, key: string) {
  const [iv, encrypted] = data.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    convertTo256BitKey(key) as unknown as crypto.BinaryLike,
    Buffer.from(iv, 'hex') as unknown as crypto.BinaryLike
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
