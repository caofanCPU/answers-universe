import type { OuterQuestionBaseQuery, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import type { AnswersUniverseQuestionsBaseClient, AnswersUniverseResolvedOptions } from './types.js';
import { requestJson } from './http.js';
import { appendQueryParams, chunkArray, mapWithConcurrency, uniqueNonEmptyStrings } from './utils.js';

const QUESTIONS_BASE_PATH = '/api/outer/v1/questions-base';

export function createQuestionsBaseClient(options: AnswersUniverseResolvedOptions): AnswersUniverseQuestionsBaseClient {
  return {
    async getByIds(ids: string[]): Promise<OuterQuestionBaseResult> {
      const normalizedIds = uniqueNonEmptyStrings(ids);
      const chunks = chunkArray(normalizedIds, options.idsBatchSize);

      const results = await mapWithConcurrency(chunks, options.parallelism, async (idGroup) => {
        const searchParams = new URLSearchParams();
        appendQueryParams(searchParamsToUrl(searchParams), {
          ids: idGroup,
          page: 1,
          pageSize: idGroup.length || options.idsBatchSize,
        });

        return requestJson<OuterQuestionBaseResult>(options, QUESTIONS_BASE_PATH, {
          method: 'GET',
          query: searchParams,
        });
      });

      const mergedItems = results.flatMap((result) => result.items);
      const total = mergedItems.length;

      return {
        items: mergedItems,
        pagination: {
          page: 1,
          pageSize: total,
          total,
          totalPages: total > 0 ? 1 : 0,
        },
      };
    },

    async query(params: OuterQuestionBaseQuery): Promise<OuterQuestionBaseResult> {
      const searchParams = new URLSearchParams();
      appendQueryParams(searchParamsToUrl(searchParams), {
        page: params.page,
        pageSize: params.pageSize,
        ids: params.ids,
        uuids: params.uuids,
        asFirst: params.asFirst,
        category: params.category,
        subCategory: params.subCategory,
        difficulty: params.difficulty,
        createdAtFrom: params.createdAtFrom,
        createdAtTo: params.createdAtTo,
        updatedAtFrom: params.updatedAtFrom,
        updatedAtTo: params.updatedAtTo,
      });

      return requestJson<OuterQuestionBaseResult>(options, QUESTIONS_BASE_PATH, {
        method: 'GET',
        query: searchParams,
      });
    },
  };
}

function searchParamsToUrl(searchParams: URLSearchParams): URL {
  const url = new URL('https://sdk.local');
  url.search = searchParams.toString();
  return url;
}
