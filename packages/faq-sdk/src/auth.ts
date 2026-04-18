import { createHash, randomUUID, sign } from 'node:crypto';
import type { AnswersUniverseResolvedOptions } from './types.js';

function normalizePemKey(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }

  const matched = trimmed.match(/^(pk_(?:test|live)|sk_(?:test|live))_(.+)$/);

  if (!matched) {
    return trimmed;
  }

  const [, prefix, encoded] = matched;
  const binary = Buffer.from(encoded, 'base64url');
  const body = binary.toString('base64').match(/.{1,64}/g)?.join('\n') ?? binary.toString('base64');
  const keyType = prefix.startsWith('pk_') ? 'PUBLIC' : 'PRIVATE';

  return `-----BEGIN ${keyType} KEY-----\n${body}\n-----END ${keyType} KEY-----`;
}

export function buildAuthHeaders(_options: AnswersUniverseResolvedOptions, _request: {
  method: string;
  path: string;
  query: string;
  body?: string;
}): Record<string, string> {
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const bodyHash = createHash('sha256').update(_request.body ?? '').digest('hex');
  const payload = [
    _request.method.toUpperCase(),
    _request.path,
    _request.query,
    bodyHash,
    timestamp,
    nonce,
    _options.clientId,
    _options.keyVersion,
  ].join('\n');

  const signature = sign(null, Buffer.from(payload, 'utf8'), normalizePemKey(_options.privateKey)).toString('base64url');

  return {
    'x-au-client-id': _options.clientId,
    'x-au-key-version': _options.keyVersion,
    'x-au-timestamp': timestamp,
    'x-au-nonce': nonce,
    'x-au-signature': signature,
  };
}
