import { AnswersUniverseSdkError } from './errors.js';
import type { AnswersUniverseClientOptions, AnswersUniverseResolvedOptions } from './types.js';

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new AnswersUniverseSdkError('INVALID_CONFIG', `Missing required environment variable: ${name}`);
  }

  return value;
}

export function readClientOptionsFromEnv(): AnswersUniverseClientOptions {
  return {
    baseUrl: readRequiredEnv('WINDRUN_HUAIIN_FAQ_BASE_URL'),
    clientId: readRequiredEnv('WINDRUN_HUAIIN_FAQ_CLIENT_ID'),
    keyVersion: readRequiredEnv('WINDRUN_HUAIIN_FAQ_KEY_VERSION'),
    publicKey: readRequiredEnv('NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK'),
    privateKey: readRequiredEnv('WINDRUN_HUAIIN_FAQ_SK'),
  };
}

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
    fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
  };
}
