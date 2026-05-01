import { createHash, verify } from 'node:crypto';
import type { NextRequest } from 'next/server';

export function unwrapPlatformPublicKey(value: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/^pk_(?:test|live)_(.+)$/);

  if (!matched) {
    throw new Error('INVALID_OUTER_PUBLIC_KEY');
  }

  const [, encoded] = matched;
  const decoded = Buffer.from(encoded, 'base64url').toString('utf8');

  if (!decoded.trim().startsWith('-----BEGIN PUBLIC KEY-----')) {
    throw new Error('INVALID_OUTER_PUBLIC_KEY');
  }

  return decoded.trim();
}

function isOuterSignatureDebugEnabled(): boolean {
  return process.env.WINDRUN_HUAIIN_SDK_DEBUG === 'true' && process.env.WINDRUN_HUAIIN_SDK_SIGNATURE_DEBUG === 'true';
}

function buildKeyFingerprint(publicKey: string): string {
  return createHash('sha256').update(publicKey).digest('hex');
}

export async function buildOuterV1SignaturePayload(req: NextRequest, authContext: {
  clientId: string;
  keyVersion: string;
  timestamp: string;
  nonce: string;
}): Promise<string> {
  const bodyText = await readRequestBody(req);
  const bodyHash = createHash('sha256').update(bodyText).digest('hex');
  const sortedQuery = canonicalizeSearchParams(req.nextUrl.searchParams);

  return [
    req.method.toUpperCase(),
    req.nextUrl.pathname,
    sortedQuery,
    bodyHash,
    authContext.timestamp,
    authContext.nonce,
    authContext.clientId,
    authContext.keyVersion,
  ].join('\n');
}

export function verifyOuterV1Signature(params: {
  publicKey: string;
  payload: string;
  signature: string;
  algorithm: string;
  traceId?: string;
}): boolean {
  const normalizedAlgorithm = params.algorithm.toLowerCase();

  if (normalizedAlgorithm !== 'ed25519') {
    throw new Error('UNSUPPORTED_OUTER_KEY_ALGORITHM');
  }

  const normalizedPublicKey = unwrapPlatformPublicKey(params.publicKey);
  const normalizedSignature = Buffer.from(params.signature, 'base64url');
  const valid = verify(null, Buffer.from(params.payload, 'utf8'), normalizedPublicKey, normalizedSignature);

  if (isOuterSignatureDebugEnabled()) {
    console.debug('[Outer V1 Auth] Verified request signature', {
      ...(params.traceId ? { traceId: params.traceId } : {}),
      algorithm: normalizedAlgorithm,
      publicKeyFingerprint: buildKeyFingerprint(normalizedPublicKey),
      payload: params.payload,
      receivedSignature: params.signature,
      valid,
    });
  }

  return valid;
}

function canonicalizeSearchParams(searchParams: URLSearchParams): string {
  const entries = Array.from(searchParams.entries()).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyCompare = leftKey.localeCompare(rightKey);
    return keyCompare !== 0 ? keyCompare : leftValue.localeCompare(rightValue);
  });

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function readRequestBody(req: NextRequest): Promise<string> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return '';
  }

  const clone = req.clone();
  return clone.text();
}
