import type { OuterQuestionDetailDto } from '@windrun-huaiin/faq-contracts/outer/v1';
import { deleteKey, getJson, mgetJson, publishMessage, setJson } from '@windrun-huaiin/backend-core/lib';

const OUTER_QUESTION_DETAIL_CACHE_KEY_PREFIX = 'outer:v1:question:detail';
const OUTER_QUESTION_DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 24;

export type OuterQuestionCacheRebuildPayload = {
  questionId: string;
  reason: 'create' | 'update' | 'delete' | 'import' | 'read_miss';
  deleteOnly?: boolean;
};

function buildQuestionDetailCacheKey(questionId: string): string {
  return `${OUTER_QUESTION_DETAIL_CACHE_KEY_PREFIX}:${questionId}`;
}

function resolveAppBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_QSTASH_CACHE_TASK_URL ?? null;

  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export async function getOuterQuestionDetailCache(questionId: string): Promise<OuterQuestionDetailDto | null> {
  return getJson<OuterQuestionDetailDto>(buildQuestionDetailCacheKey(questionId));
}

export async function getOuterQuestionDetailCacheMap(
  questionIds: string[]
): Promise<Map<string, OuterQuestionDetailDto>> {
  const uniqueQuestionIds = Array.from(new Set(questionIds));

  if (uniqueQuestionIds.length === 0) {
    return new Map();
  }

  const values = await mgetJson<OuterQuestionDetailDto>(
    uniqueQuestionIds.map((questionId) => buildQuestionDetailCacheKey(questionId))
  );
  const result = new Map<string, OuterQuestionDetailDto>();

  values?.forEach((value, index) => {
    if (value) {
      result.set(uniqueQuestionIds[index], value);
    }
  });

  return result;
}

export async function setOuterQuestionDetailCache(
  questionId: string,
  value: OuterQuestionDetailDto
): Promise<boolean> {
  return setJson(buildQuestionDetailCacheKey(questionId), value, OUTER_QUESTION_DETAIL_CACHE_TTL_SECONDS);
}

export async function deleteOuterQuestionDetailCache(questionId: string): Promise<boolean> {
  return deleteKey(buildQuestionDetailCacheKey(questionId));
}

export async function enqueueOuterQuestionDetailCacheRebuild(
  payload: OuterQuestionCacheRebuildPayload
): Promise<string | null> {
  const url = resolveAppBaseUrl();

  if (!url) {
    console.warn('[Outer Question Cache] Skip QStash publish: missing NEXT_PUBLIC_QSTASH_CACHE_TASK_URL');
    return null;
  }

  const result = await publishMessage({
    url,
    body: payload,
  });

  return result?.messageId ?? null;
}

export const outerQuestionDetailCacheKey = {
  prefix: OUTER_QUESTION_DETAIL_CACHE_KEY_PREFIX,
  ttlSeconds: OUTER_QUESTION_DETAIL_CACHE_TTL_SECONDS,
  build: buildQuestionDetailCacheKey,
} as const;
