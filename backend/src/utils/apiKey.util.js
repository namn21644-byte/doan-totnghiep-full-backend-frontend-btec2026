import crypto from 'crypto';

export function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function getApiKeyPrefix(apiKey) {
  return apiKey.slice(0, 8);
}
