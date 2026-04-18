import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { normalizePemKey } from './signature';

type OuterClientKeyEnvironment = 'test' | 'live';

function wrapPemKey(prefix: string, pem: string): string {
  const base64 = Buffer.from(normalizePemKey(pem), 'utf8').toString('base64url');
  return `${prefix}_${base64}`;
}

export function generateOuterClientKeyPair(environment: OuterClientKeyEnvironment) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
  const keyVersion = randomUUID();
  const publicKeyWrapped = wrapPemKey(`pk_${environment}`, publicKeyPem);
  const privateKeyWrapped = wrapPemKey(`sk_${environment}`, privateKeyPem);
  const fingerprint = createHash('sha256').update(normalizePemKey(publicKeyWrapped)).digest('hex');

  return {
    environment,
    keyVersion,
    algorithm: 'ed25519',
    publicKey: publicKeyWrapped,
    privateKey: privateKeyWrapped,
    fingerprint,
  };
}
