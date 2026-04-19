import { readClientOptionsFromEnv, resolveClientOptions } from './config.js';
import { createQuestionsBaseClient } from './questions-base.js';
import type { AnswersUniverseClient, AnswersUniverseClientOptions } from './types.js';

export * from './errors.js';
export * from './types.js';
export type * from '@windrun-huaiin/faq-contracts/outer/v1';

export function createAnswersUniverseClient(options: AnswersUniverseClientOptions): AnswersUniverseClient {
  const resolvedOptions = resolveClientOptions(options);

  return {
    options: resolvedOptions,
    v1: {
      questionsBase: createQuestionsBaseClient(resolvedOptions),
    },
  };
}

export function createAnswersUniverseClientFromEnv(): AnswersUniverseClient {
  return createAnswersUniverseClient(readClientOptionsFromEnv());
}
