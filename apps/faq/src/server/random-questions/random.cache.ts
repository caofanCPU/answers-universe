import { acquireLock, getJson, getPrefixedRedisKey, releaseLock, setJson } from '@windrun-huaiin/backend-core/upstash/server';
import type {
  RandomQuestionAnalysisResult,
  RandomQuestionDraftItem,
  RandomQuestionPlannedGroup,
  RandomQuestionPreviewStats,
  RandomQuestionReason,
} from './types';

const RANDOM_QUESTION_CACHE_ENABLED_ENV = 'WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED';
const RANDOM_QUESTION_CACHE_TTL_DAYS_ENV = 'WINDRUN_HUAIIN_FAQ_RANDOM_CACHE_TTL_DAYS';
const DEFAULT_RANDOM_QUESTION_CACHE_TTL_DAYS = 1;
const SECONDS_PER_DAY = 60 * 60 * 24;

const RANDOM_QUESTION_ANALYSIS_SNAPSHOT_KEY_PREFIX = 'random:v1:analysis:snapshot';
const RANDOM_QUESTION_ANALYSIS_REBUILD_LOCK_KEY_PREFIX = 'random:v1:lock:analysis:rebuild';
const RANDOM_QUESTION_COMMIT_LOCK_KEY_PREFIX = 'random:v1:lock:commit';

const DEFAULT_ANALYSIS_REBUILD_LOCK_TTL_MS = 60_000;
const DEFAULT_COMMIT_LOCK_TTL_MS = 60_000;

export type RandomQuestionCachedPlannedGroup = {
  groupId: string;
  targetCount: number;
  canCommit: boolean;
  reasons: RandomQuestionReason[];
  messages: string[];
  stats: RandomQuestionPreviewStats;
  items: RandomQuestionDraftItem[];
};

export type RandomQuestionAnalysisSnapshot = {
  version: string;
  builtAt: string;
  targetCount: number;
  summary: RandomQuestionAnalysisResult;
  plannedGroups: RandomQuestionCachedPlannedGroup[];
};

function normalizeRandomQuestionAnalysisSnapshot(
  snapshot: RandomQuestionAnalysisSnapshot
): RandomQuestionAnalysisSnapshot {
  return {
    ...snapshot,
    summary: {
      ...snapshot.summary,
      snapshotVersion: snapshot.summary.snapshotVersion || snapshot.version,
    },
  };
}

function buildRandomQuestionAnalysisSnapshotKey(): string {
  return RANDOM_QUESTION_ANALYSIS_SNAPSHOT_KEY_PREFIX;
}

function buildRandomQuestionAnalysisRebuildLockKey(): string {
  return RANDOM_QUESTION_ANALYSIS_REBUILD_LOCK_KEY_PREFIX;
}

function buildRandomQuestionCommitLockKey(): string {
  return RANDOM_QUESTION_COMMIT_LOCK_KEY_PREFIX;
}

function resolveRandomQuestionCacheTtlSeconds(): number {
  const rawValue = process.env[RANDOM_QUESTION_CACHE_TTL_DAYS_ENV]?.trim();

  if (!rawValue) {
    return DEFAULT_RANDOM_QUESTION_CACHE_TTL_DAYS * SECONDS_PER_DAY;
  }

  const parsedDays = Number(rawValue);
  if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
    return DEFAULT_RANDOM_QUESTION_CACHE_TTL_DAYS * SECONDS_PER_DAY;
  }

  return parsedDays * SECONDS_PER_DAY;
}

export function isRandomQuestionCacheEnabled(): boolean {
  return process.env[RANDOM_QUESTION_CACHE_ENABLED_ENV] === 'true';
}

export async function getRandomQuestionAnalysisSnapshot(): Promise<RandomQuestionAnalysisSnapshot | null> {
  if (!isRandomQuestionCacheEnabled()) {
    return null;
  }

  const snapshot = await getJson<RandomQuestionAnalysisSnapshot>(buildRandomQuestionAnalysisSnapshotKey());

  return snapshot ? normalizeRandomQuestionAnalysisSnapshot(snapshot) : null;
}

export async function setRandomQuestionAnalysisSnapshot(
  snapshot: RandomQuestionAnalysisSnapshot
): Promise<boolean> {
  if (!isRandomQuestionCacheEnabled()) {
    return false;
  }

  return setJson(
    buildRandomQuestionAnalysisSnapshotKey(),
    normalizeRandomQuestionAnalysisSnapshot(snapshot),
    resolveRandomQuestionCacheTtlSeconds()
  );
}

export async function withRandomQuestionAnalysisRebuildLock<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isRandomQuestionCacheEnabled()) {
    return fn();
  }

  const key = buildRandomQuestionAnalysisRebuildLockKey();
  const token = await acquireLock(key, DEFAULT_ANALYSIS_REBUILD_LOCK_TTL_MS);

  if (!token) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
}

export async function withRandomQuestionCommitLock<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isRandomQuestionCacheEnabled()) {
    return fn();
  }

  const key = buildRandomQuestionCommitLockKey();
  const token = await acquireLock(key, DEFAULT_COMMIT_LOCK_TTL_MS);

  if (!token) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
}

export const randomQuestionCacheKey = {
  snapshotPrefix: RANDOM_QUESTION_ANALYSIS_SNAPSHOT_KEY_PREFIX,
  analysisRebuildLockPrefix: RANDOM_QUESTION_ANALYSIS_REBUILD_LOCK_KEY_PREFIX,
  commitLockPrefix: RANDOM_QUESTION_COMMIT_LOCK_KEY_PREFIX,
  snapshot: buildRandomQuestionAnalysisSnapshotKey,
  analysisRebuildLock: buildRandomQuestionAnalysisRebuildLockKey,
  commitLock: buildRandomQuestionCommitLockKey,
  ttlSeconds: resolveRandomQuestionCacheTtlSeconds(),
  enabledEnv: RANDOM_QUESTION_CACHE_ENABLED_ENV,
  ttlDaysEnv: RANDOM_QUESTION_CACHE_TTL_DAYS_ENV,
  prefixedSnapshot: () => getPrefixedRedisKey(buildRandomQuestionAnalysisSnapshotKey()),
} as const;

export function toCachedPlannedGroups(groups: RandomQuestionPlannedGroup[]): RandomQuestionCachedPlannedGroup[] {
  return groups.map((group) => ({
    groupId: group.groupId,
    targetCount: group.targetCount,
    canCommit: group.canCommit,
    reasons: group.reasons,
    messages: group.messages,
    stats: group.stats,
    items: group.items.map((item) => ({
      questionId: item.questionId,
      questionUuid: item.questionUuid,
      asFirst: item.asFirst,
      category: item.category,
      sortOrder: item.sortOrder,
    })),
  }));
}
