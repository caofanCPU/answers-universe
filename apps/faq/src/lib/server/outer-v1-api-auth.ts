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

type OuterV1ApiAuthOptions = {
  reserveNonce?: boolean;
  validateTimestampWindow?: boolean;
  traceId?: string;
};

function requireHeader(req: NextRequest, headerName: string): string {
  const value = req.headers.get(headerName)?.trim();

  if (!value) {
    throw new Error('UNAUTHORIZED');
  }

  return value;
}

function isOuterAuthDebugEnabled(): boolean {
  return process.env.WINDRUN_HUAIIN_SDK_DEBUG === 'true';
}

function withTraceId(traceId?: string): { traceId: string } | Record<string, never> {
  return traceId ? { traceId } : {};
}

function debugAuthStep(
  enabled: boolean,
  traceId: string | undefined,
  step: string,
  startedAt: number,
  extra: Record<string, unknown> = {}
) {
  if (!enabled) {
    return;
  }

  console.debug('[Outer V1 Auth] Step completed', {
    ...withTraceId(traceId),
    step,
    durationMs: Date.now() - startedAt,
    ...extra,
  });
}

export async function requireOuterV1ApiAuth(
  req: NextRequest,
  options: OuterV1ApiAuthOptions = {}
): Promise<OuterV1AuthContext> {
  const authStartedAt = Date.now();
  const debugEnabled = isOuterAuthDebugEnabled();
  const shouldReserveNonce = options.reserveNonce ?? true;
  const shouldValidateTimestampWindow = options.validateTimestampWindow ?? true;
  const readHeadersStartedAt = Date.now();
  const clientId = requireHeader(req, OUTER_CLIENT_ID_HEADER);
  const keyVersion = requireHeader(req, OUTER_KEY_VERSION_HEADER);
  const timestamp = requireHeader(req, OUTER_TIMESTAMP_HEADER);
  const nonce = requireHeader(req, OUTER_NONCE_HEADER);
  const signature = requireHeader(req, OUTER_SIGNATURE_HEADER);
  debugAuthStep(debugEnabled, options.traceId, 'read_headers', readHeadersStartedAt, {
    clientId,
    keyVersion,
  });

  const timestampStartedAt = Date.now();
  const requestTimestamp = new Date(timestamp);

  if (Number.isNaN(requestTimestamp.getTime())) {
    throw new Error('UNAUTHORIZED');
  }

  if (shouldValidateTimestampWindow) {
    const now = Date.now();
    const timeDiff = Math.abs(now - requestTimestamp.getTime());

    if (timeDiff > OUTER_V1_AUTH_WINDOW_MS) {
      throw new Error('UNAUTHORIZED');
    }
  }
  debugAuthStep(debugEnabled, options.traceId, 'validate_timestamp', timestampStartedAt, {
    validateTimestampWindow: shouldValidateTimestampWindow,
  });

  const loadKeyStartedAt = Date.now();
  const keyRecord = await getActiveOuterClientKey(clientId, keyVersion);
  debugAuthStep(debugEnabled, options.traceId, 'load_active_key', loadKeyStartedAt, {
    found: Boolean(keyRecord),
  });

  if (!keyRecord) {
    throw new Error('UNAUTHORIZED');
  }

  if (shouldReserveNonce) {
    const reserveNonceStartedAt = Date.now();
    const nonceReserved = await reserveOuterV1Nonce({
      clientId,
      keyVersion,
      nonce,
      timestamp,
    });
    debugAuthStep(debugEnabled, options.traceId, 'reserve_nonce', reserveNonceStartedAt, {
      reserved: nonceReserved,
    });

    if (!nonceReserved) {
      throw new Error('UNAUTHORIZED');
    }
  }

  const authContext: OuterV1AuthContext = {
    clientId,
    keyVersion,
    timestamp,
    nonce,
    signature,
  };

  const payloadStartedAt = Date.now();
  const payload = await buildOuterV1SignaturePayload(req, authContext);
  debugAuthStep(debugEnabled, options.traceId, 'build_signature_payload', payloadStartedAt, {
    method: req.method.toUpperCase(),
    path: req.nextUrl.pathname,
    query: req.nextUrl.searchParams.toString(),
  });

  if (debugEnabled) {
    console.debug('[Outer V1 Auth] Rebuilt request payload', {
      ...withTraceId(options.traceId),
      clientId,
      keyVersion,
      timestamp,
      nonce,
      receivedSignature: signature,
      method: req.method.toUpperCase(),
      path: req.nextUrl.pathname,
      query: req.nextUrl.searchParams.toString(),
      payload,
    });
  }

  const verifyStartedAt = Date.now();
  const valid = verifyOuterV1Signature({
    publicKey: keyRecord.publicKey,
    payload,
    signature,
    algorithm: keyRecord.algorithm,
    traceId: options.traceId,
  });
  debugAuthStep(debugEnabled, options.traceId, 'verify_signature', verifyStartedAt, {
    valid,
  });

  if (!valid) {
    throw new Error('UNAUTHORIZED');
  }

  const touchStartedAt = Date.now();
  await touchOuterClientKeyLastUsedAt(clientId, keyVersion);
  debugAuthStep(debugEnabled, options.traceId, 'touch_last_used_at', touchStartedAt);
  debugAuthStep(debugEnabled, options.traceId, 'total', authStartedAt, {
    clientId,
    keyVersion,
  });

  return authContext;
}

export const outerV1ApiAuthHeaders = {
  clientId: OUTER_CLIENT_ID_HEADER,
  keyVersion: OUTER_KEY_VERSION_HEADER,
  timestamp: OUTER_TIMESTAMP_HEADER,
  nonce: OUTER_NONCE_HEADER,
  signature: OUTER_SIGNATURE_HEADER,
} as const;
