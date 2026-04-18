import { createHash, verify } from 'node:crypto';
import type { NextRequest } from 'next/server';

export function normalizePemKey(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }

  const [prefix, encoded] = splitWrappedKey(trimmed);

  if (!prefix.startsWith('pk_') && !prefix.startsWith('sk_')) {
    return trimmed;
  }

  const binary = Buffer.from(encoded, 'base64url');
  const body = binary.toString('base64').match(/.{1,64}/g)?.join('\n') ?? binary.toString('base64');
  const keyType = prefix.startsWith('pk_') ? 'PUBLIC' : 'PRIVATE';

  return `-----BEGIN ${keyType} KEY-----\n${body}\n-----END ${keyType} KEY-----`;
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
}): boolean {
  const normalizedAlgorithm = params.algorithm.toLowerCase();

  if (normalizedAlgorithm !== 'ed25519') {
    throw new Error('UNSUPPORTED_OUTER_KEY_ALGORITHM');
  }

  const normalizedPublicKey = normalizePemKey(params.publicKey);
  const normalizedSignature = Buffer.from(params.signature, 'base64url');

  return verify(null, Buffer.from(params.payload, 'utf8'), normalizedPublicKey, normalizedSignature);
}

function splitWrappedKey(value: string): [string, string] {
  const matched = value.match(/^(pk_(?:test|live)|sk_(?:test|live))_(.+)$/);

  if (!matched) {
    return ['', value];
  }

  return [matched[1], matched[2]];
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
