import { createHash, randomUUID, sign } from 'node:crypto';
import type { AnswersUniverseResolvedOptions } from './types.js';

function unwrapPlatformPrivateKey(value: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/^sk_(?:test|live)_(.+)$/);

  if (!matched) {
    throw new Error('INVALID_FAQ_PRIVATE_KEY');
  }

  const [, encoded] = matched;
  const decoded = Buffer.from(encoded, 'base64url').toString('utf8');

  if (!decoded.trim().startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('INVALID_FAQ_PRIVATE_KEY');
  }

  return decoded.trim();
}

function isAuthDebugEnabled(): boolean {
  return process.env.WINDRUN_HUAIIN_SDK_DEBUG === 'true';
}

export function buildAuthHeaders(_options: AnswersUniverseResolvedOptions, _request: {
  method: string;
  path: string;
  query: string;
  body?: string;
  traceId?: string;
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

  const signature = sign(null, Buffer.from(payload, 'utf8'), unwrapPlatformPrivateKey(_options.privateKey)).toString('base64url');

  if (isAuthDebugEnabled()) {
    console.debug('[FAQ SDK Auth] Built request signature', {
      ...(_request.traceId ? { traceId: _request.traceId } : {}),
      clientId: _options.clientId,
      keyVersion: _options.keyVersion,
      method: _request.method.toUpperCase(),
      path: _request.path,
      query: _request.query,
      bodyHash,
      timestamp,
      nonce,
      payload,
      signature,
    });
  }

  return {
    'x-au-client-id': _options.clientId,
    'x-au-key-version': _options.keyVersion,
    'x-au-timestamp': timestamp,
    'x-au-nonce': nonce,
    'x-au-signature': signature,
  };
}
