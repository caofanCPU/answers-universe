import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

const OUTER_IDENTITY_HEADER = 'x-outer-identity-provider';
const OUTER_TOKEN_PREFIX = 'OUTER_TOKEN_';
const OUTER_IDENTITY_PREFIX = 'OUTER_IDEN_';

type OuterApiCredential = {
  identityProvider: string;
  token: string;
};

function normalizeEnvValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getOuterApiCredentials(): OuterApiCredential[] {
  const suffixes = new Set<string>();

  for (const key of Object.keys(process.env)) {
    if (key.startsWith(OUTER_TOKEN_PREFIX)) {
      suffixes.add(key.slice(OUTER_TOKEN_PREFIX.length));
    }
    if (key.startsWith(OUTER_IDENTITY_PREFIX)) {
      suffixes.add(key.slice(OUTER_IDENTITY_PREFIX.length));
    }
  }

  return Array.from(suffixes)
    .map((suffix) => {
      const token = normalizeEnvValue(process.env[`${OUTER_TOKEN_PREFIX}${suffix}`]);
      const identityProvider = normalizeEnvValue(process.env[`${OUTER_IDENTITY_PREFIX}${suffix}`]);

      if (!token || !identityProvider) {
        return null;
      }

      return {
        identityProvider,
        token,
      };
    })
    .filter((item): item is OuterApiCredential => item !== null);
}

function extractBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')?.trim();

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function requireOuterApiAuth(req: NextRequest): string {
  const identityProvider = req.headers.get(OUTER_IDENTITY_HEADER)?.trim();
  const token = extractBearerToken(req);
  const credentials = getOuterApiCredentials();

  if (!identityProvider || !token || credentials.length === 0) {
    throw new Error('UNAUTHORIZED');
  }

  const matchedCredential = credentials.find(
    (credential) => credential.identityProvider === identityProvider
  );

  if (!matchedCredential || !safeEqual(token, matchedCredential.token)) {
    throw new Error('UNAUTHORIZED');
  }

  return matchedCredential.identityProvider;
}

export const outerApiAuthHeaders = {
  identityProvider: OUTER_IDENTITY_HEADER,
  authorization: 'authorization',
} as const;
