import type { OuterQuestionBaseQuery, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import type { AnswersUniverseQuestionsBaseClient, AnswersUniverseResolvedOptions } from './types.js';
import { requestJson } from './http.js';
import { uniqueNonEmptyStrings } from './utils.js';

const QUESTIONS_BASE_PATH = '/api/outer/v1/questions-base';

export function createQuestionsBaseClient(options: AnswersUniverseResolvedOptions): AnswersUniverseQuestionsBaseClient {
  async function getByIds(ids: string[]): Promise<OuterQuestionBaseResult> {
    const normalizedIds = uniqueNonEmptyStrings(ids);

    return requestJson<OuterQuestionBaseResult>(options, QUESTIONS_BASE_PATH, {
      method: 'POST',
      body: {
        ids: normalizedIds,
      },
    });
  }

  return {
    getByIds,

    async query(params: OuterQuestionBaseQuery): Promise<OuterQuestionBaseResult> {
      return getByIds(params.ids ?? []);
    },
  };
}
