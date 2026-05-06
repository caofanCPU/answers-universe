import type {
  RandomQuestionDraftItem,
  RandomQuestionPreviewResult,
} from '@/server/random-questions/types';

export type RequestState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type PlannedDay = {
  showDate: string;
  groupId: string;
  preview: RandomQuestionPreviewResult;
};

export function toRandomQuestionDraftItems(items: RandomQuestionPreviewResult['items']): RandomQuestionDraftItem[] {
  return items.map((item) => ({
    questionId: item.questionId,
    questionUuid: item.questionUuid,
    asFirst: item.asFirst,
    category: item.category,
    sortOrder: item.sortOrder,
  }));
}

export function isSnapshotVersionMismatchResponse(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }

  return 'error' in body && body.error === 'SNAPSHOT_VERSION_MISMATCH';
}
