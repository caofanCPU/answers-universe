import type { QuestionImportValidationItem } from '@/server/questions/types';

export type RawImportItem = {
  importId?: unknown;
  question?: unknown;
  cdnImagePrefix?: unknown;
  cdn_image_prefix?: unknown;
  questionImage?: unknown;
  question_image?: unknown;
  correctAnswer?: unknown;
  correct_answer?: unknown;
  correctAnswerIndex?: unknown;
  correct_answer_index?: unknown;
  incorrectAnswers?: unknown;
  incorrect_answers?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  category?: unknown;
  subCategory?: unknown;
  sub_category?: unknown;
  tags?: unknown;
  keywords?: unknown;
  asFirst?: unknown;
  as_first?: unknown;
};

export type ParseResult = {
  rawItems: RawImportItem[];
  parseError: string | null;
};

export function normalizeImportItemAliases(item: RawImportItem): RawImportItem {
  return {
    ...item,
    cdnImagePrefix: item.cdnImagePrefix ?? item.cdn_image_prefix,
    questionImage: item.questionImage ?? item.question_image,
    correctAnswer: item.correctAnswer ?? item.correct_answer,
    correctAnswerIndex: item.correctAnswerIndex ?? item.correct_answer_index,
    incorrectAnswers: item.incorrectAnswers ?? item.incorrect_answers,
    subCategory: item.subCategory ?? item.sub_category,
    asFirst: item.asFirst ?? item.as_first,
  };
}

export function createImportId(index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `imp_${crypto.randomUUID()}`;
  }

  return `imp_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureImportIds(items: RawImportItem[]): RawImportItem[] {
  return items.map((item, index) => {
    const normalized = normalizeImportItemAliases(item);

    return {
      ...normalized,
      importId:
        typeof normalized.importId === 'string' && normalized.importId.trim().length > 0
          ? normalized.importId.trim()
          : createImportId(index),
    };
  });
}

export function parseImportText(source: string): ParseResult {
  if (!source.trim()) {
    return {
      rawItems: [],
      parseError: null,
    };
  }

  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        rawItems: [],
        parseError: 'Root JSON value must be an array.',
      };
    }

    return {
      rawItems: (parsed as RawImportItem[]).map(normalizeImportItemAliases),
      parseError: null,
    };
  } catch (error) {
    return {
      rawItems: [],
      parseError: error instanceof Error ? error.message : 'JSON parse failed',
    };
  }
}

export function stringifyItems(items: RawImportItem[]) {
  return `${JSON.stringify(items, null, 2)}\n`;
}

export function toRequestItem(item: RawImportItem | QuestionImportValidationItem): Record<string, unknown> {
  if ('valid' in item) {
    return {
      importId: item.importId,
      question: item.question,
      cdnImagePrefix: item.cdnImagePrefix,
      questionImage: item.questionImage,
      correctAnswer: item.correctAnswer,
      correctAnswerIndex: item.correctAnswerIndex ?? undefined,
      incorrectAnswers: item.incorrectAnswers,
      explanation: item.explanation,
      difficulty: item.difficulty,
      category: item.category,
      subCategory: item.subCategory ?? '',
      tags: item.tags,
      keywords: item.keywords,
      asFirst: item.asFirst,
    };
  }

  return normalizeImportItemAliases(item) as Record<string, unknown>;
}
