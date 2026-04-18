import type { OuterQuestionDetailDto } from '@windrun-huaiin/faq-contracts/outer/v1';
import type { AnswersUniverseQuestionDetailClient, AnswersUniverseResolvedOptions } from './types.js';
import { requestJson } from './http.js';

export function createQuestionDetailClient(options: AnswersUniverseResolvedOptions): AnswersUniverseQuestionDetailClient {
  return {
    async getById(id: string): Promise<OuterQuestionDetailDto> {
      const searchParams = new URLSearchParams();
      searchParams.set('id', id);

      return requestJson<OuterQuestionDetailDto>(options, '/api/outer/v1/questions-base/detail', {
        method: 'GET',
        query: searchParams,
      });
    },
  };
}
