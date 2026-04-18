import { AnswersUniverseSdkError } from './errors.js';
import type { AnswersUniverseClientOptions, AnswersUniverseResolvedOptions } from './types.js';

export function resolveClientOptions(options: AnswersUniverseClientOptions): AnswersUniverseResolvedOptions {
  if (!options.baseUrl?.trim()) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'baseUrl is required');
  }

  if (!options.clientId?.trim()) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'clientId is required');
  }

  if (!options.keyVersion?.trim()) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'keyVersion is required');
  }

  if (!options.publicKey?.trim()) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'publicKey is required');
  }

  if (!options.privateKey?.trim()) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'privateKey is required');
  }

  if (typeof globalThis.fetch !== 'function' && !options.fetch) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', 'A fetch implementation is required in this runtime');
  }

  return {
    baseUrl: options.baseUrl.replace(/\/+$/, ''),
    clientId: options.clientId.trim(),
    keyVersion: options.keyVersion.trim(),
    publicKey: options.publicKey.trim(),
    privateKey: options.privateKey.trim(),
    version: options.version ?? 'v1',
    idsBatchSize: Math.min(Math.max(1, options.idsBatchSize ?? 50), 100),
    parallelism: Math.max(1, options.parallelism ?? 3),
    timeoutMs: Math.max(1, options.timeoutMs ?? 10_000),
    fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
  };
}
