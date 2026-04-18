import { withRedis } from '@windrun-huaiin/backend-core/lib';

const OUTER_V1_NONCE_KEY_PREFIX = 'answers_universe:outer:v1:nonce';
const OUTER_V1_NONCE_TTL_SECONDS = 10 * 60;

function getOuterV1NonceKey(clientId: string, keyVersion: string, nonce: string): string {
  return `${OUTER_V1_NONCE_KEY_PREFIX}:${clientId}:${keyVersion}:${nonce}`;
}

export async function reserveOuterV1Nonce(params: {
  clientId: string;
  keyVersion: string;
  nonce: string;
  timestamp: string;
}): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const key = getOuterV1NonceKey(params.clientId, params.keyVersion, params.nonce);
    const response = await redis.set(key, params.timestamp, {
      nx: true,
      ex: OUTER_V1_NONCE_TTL_SECONDS,
    });

    return response === 'OK';
  });

  return result ?? false;
}

export const outerV1NonceKey = {
  prefix: OUTER_V1_NONCE_KEY_PREFIX,
  ttlSeconds: OUTER_V1_NONCE_TTL_SECONDS,
  build: getOuterV1NonceKey,
} as const;
