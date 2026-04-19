import type { OuterQuestionBaseQuery, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import type { AnswersUniverseQuestionsBaseClient, AnswersUniverseResolvedOptions } from './types.js';
import { requestJson } from './http.js';
import { chunkArray, mapWithConcurrency, uniqueNonEmptyStrings } from './utils.js';

const QUESTIONS_BASE_PATH = '/api/outer/v1/questions-base';

export function createQuestionsBaseClient(options: AnswersUniverseResolvedOptions): AnswersUniverseQuestionsBaseClient {
  async function getByIds(ids: string[]): Promise<OuterQuestionBaseResult> {
    const normalizedIds = uniqueNonEmptyStrings(ids);
    const chunks = chunkArray(normalizedIds, options.idsBatchSize);
    const results = await mapWithConcurrency(chunks, options.parallelism, async (idGroup) => {
      return requestJson<OuterQuestionBaseResult>(options, QUESTIONS_BASE_PATH, {
        method: 'POST',
        body: {
          ids: idGroup,
        },
      });
    });
    const mergedItems = results.flatMap((result) => result.items);

    return {
      items: mergedItems,
    };
  }

  return {
    getByIds,

    async query(params: OuterQuestionBaseQuery): Promise<OuterQuestionBaseResult> {
      return getByIds(params.ids ?? []);
    },
  };
}
