import type { OuterQuestionDetailDto } from '@windrun-huaiin/faq-contracts/outer/v1';
import { deleteKey, getJson, mgetJson, publishMessage, setJson } from '@windrun-huaiin/backend-core/upstash/server';

const OUTER_QUESTION_DETAIL_CACHE_KEY_PREFIX = 'outer:v1:question:detail';
const DEFAULT_OUTER_QUESTION_DETAIL_CACHE_TTL_DAYS = 30;
const SECONDS_PER_DAY = 60 * 60 * 24;
const OUTER_QUESTION_CACHE_ENABLED_ENV = 'WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED';
const OUTER_QUESTION_CACHE_TTL_DAYS_ENV = 'WINDRUN_HUAIIN_FAQ_OUTER_CACHE_TTL_DAYS';

export type OuterQuestionCacheRebuildPayload = {
  questionId: string;
  reason: 'create' | 'update' | 'delete' | 'import' | 'read_miss';
  deleteOnly?: boolean;
};

function buildQuestionDetailCacheKey(questionId: string): string {
  return `${OUTER_QUESTION_DETAIL_CACHE_KEY_PREFIX}:${questionId}`;
}

function resolveOuterQuestionDetailCacheTtlSeconds(): number {
  const rawValue = process.env[OUTER_QUESTION_CACHE_TTL_DAYS_ENV]?.trim();

  if (!rawValue) {
    return DEFAULT_OUTER_QUESTION_DETAIL_CACHE_TTL_DAYS * SECONDS_PER_DAY;
  }

  const parsedDays = Number(rawValue);

  if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
    return DEFAULT_OUTER_QUESTION_DETAIL_CACHE_TTL_DAYS * SECONDS_PER_DAY;
  }

  return parsedDays * SECONDS_PER_DAY;
}

export function isOuterQuestionCacheEnabled(): boolean {
  return process.env[OUTER_QUESTION_CACHE_ENABLED_ENV] === 'true';
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
  if (!isOuterQuestionCacheEnabled()) {
    return null;
  }

  return getJson<OuterQuestionDetailDto>(buildQuestionDetailCacheKey(questionId));
}

export async function getOuterQuestionDetailCacheMap(
  questionIds: string[]
): Promise<Map<string, OuterQuestionDetailDto>> {
  if (!isOuterQuestionCacheEnabled()) {
    return new Map();
  }

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
  if (!isOuterQuestionCacheEnabled()) {
    return false;
  }

  return setJson(buildQuestionDetailCacheKey(questionId), value, resolveOuterQuestionDetailCacheTtlSeconds());
}

export async function deleteOuterQuestionDetailCache(questionId: string): Promise<boolean> {
  if (!isOuterQuestionCacheEnabled()) {
    return false;
  }

  return deleteKey(buildQuestionDetailCacheKey(questionId));
}

export async function enqueueOuterQuestionDetailCacheRebuild(
  payload: OuterQuestionCacheRebuildPayload
): Promise<string | null> {
  if (!isOuterQuestionCacheEnabled()) {
    return null;
  }

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
  ttlSeconds: resolveOuterQuestionDetailCacheTtlSeconds(),
  enabledEnv: OUTER_QUESTION_CACHE_ENABLED_ENV,
  ttlDaysEnv: OUTER_QUESTION_CACHE_TTL_DAYS_ENV,
  build: buildQuestionDetailCacheKey,
} as const;
