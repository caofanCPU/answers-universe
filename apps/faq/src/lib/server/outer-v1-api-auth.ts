import 'server-only';

import { NextRequest } from 'next/server';
import { reserveOuterV1Nonce } from '@/server/outer-clients/nonce';
import { getActiveOuterClientKey, touchOuterClientKeyLastUsedAt } from '@/server/outer-clients/service';
import { buildOuterV1SignaturePayload, verifyOuterV1Signature } from '@/server/outer-clients/signature';

const OUTER_CLIENT_ID_HEADER = 'x-au-client-id';
const OUTER_KEY_VERSION_HEADER = 'x-au-key-version';
const OUTER_TIMESTAMP_HEADER = 'x-au-timestamp';
const OUTER_NONCE_HEADER = 'x-au-nonce';
const OUTER_SIGNATURE_HEADER = 'x-au-signature';
const OUTER_V1_AUTH_WINDOW_MS = 5 * 60 * 1000;

export type OuterV1AuthContext = {
  clientId: string;
  keyVersion: string;
  timestamp: string;
  nonce: string;
  signature: string;
};

function requireHeader(req: NextRequest, headerName: string): string {
  const value = req.headers.get(headerName)?.trim();

  if (!value) {
    throw new Error('UNAUTHORIZED');
  }

  return value;
}

export async function requireOuterV1ApiAuth(req: NextRequest): Promise<OuterV1AuthContext> {
  const clientId = requireHeader(req, OUTER_CLIENT_ID_HEADER);
  const keyVersion = requireHeader(req, OUTER_KEY_VERSION_HEADER);
  const timestamp = requireHeader(req, OUTER_TIMESTAMP_HEADER);
  const nonce = requireHeader(req, OUTER_NONCE_HEADER);
  const signature = requireHeader(req, OUTER_SIGNATURE_HEADER);

  const requestTimestamp = new Date(timestamp);

  if (Number.isNaN(requestTimestamp.getTime())) {
    throw new Error('UNAUTHORIZED');
  }

  const now = Date.now();
  const timeDiff = Math.abs(now - requestTimestamp.getTime());

  if (timeDiff > OUTER_V1_AUTH_WINDOW_MS) {
    throw new Error('UNAUTHORIZED');
  }

  const keyRecord = await getActiveOuterClientKey(clientId, keyVersion);

  if (!keyRecord) {
    throw new Error('UNAUTHORIZED');
  }

  const nonceReserved = await reserveOuterV1Nonce({
    clientId,
    keyVersion,
    nonce,
    timestamp,
  });

  if (!nonceReserved) {
    throw new Error('UNAUTHORIZED');
  }

  const authContext: OuterV1AuthContext = {
    clientId,
    keyVersion,
    timestamp,
    nonce,
    signature,
  };

  const payload = await buildOuterV1SignaturePayload(req, authContext);
  const valid = verifyOuterV1Signature({
    publicKey: keyRecord.publicKey,
    payload,
    signature,
    algorithm: keyRecord.algorithm,
  });

  if (!valid) {
    throw new Error('UNAUTHORIZED');
  }

  await touchOuterClientKeyLastUsedAt(clientId, keyVersion);

  return authContext;
}

export const outerV1ApiAuthHeaders = {
  clientId: OUTER_CLIENT_ID_HEADER,
  keyVersion: OUTER_KEY_VERSION_HEADER,
  timestamp: OUTER_TIMESTAMP_HEADER,
  nonce: OUTER_NONCE_HEADER,
  signature: OUTER_SIGNATURE_HEADER,
} as const;
