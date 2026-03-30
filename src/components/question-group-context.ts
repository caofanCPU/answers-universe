'use client';

export const QUESTION_GROUP_STORAGE_KEY = 'questions:last-group';

export type QuestionGroupContext = {
  groupIds: string[];
};

export function saveQuestionGroupContext(context: QuestionGroupContext) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(QUESTION_GROUP_STORAGE_KEY, JSON.stringify(context));
}

export function loadQuestionGroupContext(): QuestionGroupContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(QUESTION_GROUP_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { groupIds?: unknown };

    if (!Array.isArray(parsed.groupIds)) {
      return null;
    }

    const groupIds = parsed.groupIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

    return groupIds.length > 0 ? { groupIds } : null;
  } catch {
    return null;
  }
}
