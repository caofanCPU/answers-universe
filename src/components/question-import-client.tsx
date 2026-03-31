'use client';

import { useMemo, useState } from 'react';
import type {
  QuestionImportCommitResult,
  QuestionImportPreviewDto,
  QuestionImportValidationResult,
} from '@/server/questions/types';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';

type RawImportItem = {
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

type ParseResult = {
  previews: QuestionImportPreviewDto[];
  rawItems: RawImportItem[];
  parseError: string | null;
};

const sampleJson = `[
  {
    "question": "Which USB connector is reversible and commonly used by modern laptops and phones?",
    "correctAnswer": "USB-C",
    "correctAnswerIndex": 1,
    "incorrectAnswers": ["USB-A", "Mini USB", "Micro USB"],
    "explanation": "USB-C is reversible and widely adopted in modern devices.",
    "difficulty": "easy",
    "category": "Tech & Innovation",
    "subCategory": "science",
    "tags": ["usb", "connector", "hardware"],
    "asFirst": true
  }
]`;

function normalizeImportItemAliases(item: RawImportItem): RawImportItem {
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

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
}

function isAllowedValue<T extends readonly string[]>(value: string, options: T): value is T[number] {
  return options.includes(value);
}

function validateImportItem(item: RawImportItem, index: number): QuestionImportPreviewDto {
  const normalizedItem = normalizeImportItemAliases(item);
  const errors: string[] = [];
  const question = normalizeString(normalizedItem.question);
  const category = normalizeString(normalizedItem.category);
  const subCategory = normalizeString(normalizedItem.subCategory);
  const difficulty = normalizeString(normalizedItem.difficulty);
  const correctAnswer = normalizeString(normalizedItem.correctAnswer);
  const correctAnswerIndex = normalizeInteger(normalizedItem.correctAnswerIndex);
  const explanation = normalizeString(normalizedItem.explanation);
  const tags = normalizeTags(normalizedItem.tags);
  const keywords = normalizeTags(normalizedItem.keywords);

  if (!question) errors.push('question is required');
  if (!category) {
    errors.push('category is required');
  } else if (!isAllowedValue(category, QUESTION_CATEGORIES)) {
    errors.push(`category must be one of: ${QUESTION_CATEGORIES.join(', ')}`);
  }
  if (subCategory && !isAllowedValue(subCategory, QUESTION_SUB_CATEGORIES)) {
    errors.push(`subCategory must be one of: ${QUESTION_SUB_CATEGORIES.join(', ')}`);
  }
  if (!difficulty) {
    errors.push('difficulty is required');
  } else if (!isAllowedValue(difficulty, QUESTION_DIFFICULTIES)) {
    errors.push(`difficulty must be one of: ${QUESTION_DIFFICULTIES.join(', ')}`);
  }
  if (!correctAnswer) errors.push('correctAnswer is required');
  if (normalizedItem.correctAnswerIndex !== undefined && correctAnswerIndex === null) {
    errors.push('correctAnswerIndex must be an integer');
  }
  if (!explanation) errors.push('explanation is required');

  if (!Array.isArray(normalizedItem.incorrectAnswers)) {
    errors.push('incorrectAnswers must be an array');
  } else {
    const validIncorrectAnswers = normalizedItem.incorrectAnswers.filter(
      (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0
    );
    if (validIncorrectAnswers.length === 0) {
      errors.push('incorrectAnswers must contain at least one answer');
    }
  }

  return {
    index,
    valid: errors.length === 0,
    errors,
    question,
    category,
    subCategory,
    difficulty,
    tags,
    keywords,
  };
}

function parseImportText(source: string): ParseResult {
  if (!source.trim()) {
    return {
      previews: [],
      rawItems: [],
      parseError: null,
    };
  }

  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        previews: [],
        rawItems: [],
        parseError: 'Root JSON value must be an array.',
      };
    }

    const rawItems = (parsed as RawImportItem[]).map(normalizeImportItemAliases);
    const previews = rawItems.map((item, index) => validateImportItem(item, index));

    return {
      previews,
      rawItems,
      parseError: null,
    };
  } catch (error) {
    return {
      previews: [],
      rawItems: [],
      parseError: error instanceof Error ? error.message : 'JSON parse failed',
    };
  }
}

export function QuestionImportClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh';
  const [source, setSource] = useState(sampleJson);
  const [submitted, setSubmitted] = useState(false);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [serverValidation, setServerValidation] = useState<QuestionImportValidationResult | null>(null);
  const [commitResult, setCommitResult] = useState<QuestionImportCommitResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const result = useMemo(() => parseImportText(source), [source]);
  const summary = useMemo(() => {
    const total = result.previews.length;
    const valid = result.previews.filter((item) => item.valid).length;
    const invalid = total - valid;
    return { total, valid, invalid };
  }, [result.previews]);
  const hasValidationResult = submitted;
  const validationSummary = !hasValidationResult
    ? { total: 0, valid: 0, invalid: 0 }
    : serverValidation
      ? {
          total: serverValidation.total,
          valid: serverValidation.validCount,
          invalid: serverValidation.invalidCount,
        }
      : summary;
  const invalidReasons = useMemo(() => {
    if (!submitted || result.parseError) {
      return [];
    }

    const items = serverValidation?.items ?? result.previews;
    const counts = new Map<string, number>();

    for (const item of items) {
      for (const error of item.errors) {
        counts.set(error, (counts.get(error) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([reason, count]) => ({ reason, count }));
  }, [result.parseError, result.previews, serverValidation, submitted]);
  const commitEnabled =
    !committing &&
    !result.parseError &&
    result.rawItems.length > 0 &&
    (serverValidation ? serverValidation.invalidCount === 0 : false);

  async function handleValidate() {
    setSubmitted(true);
    setCommitResult(null);
    setServerValidation(null);
    setServerError(null);

    if (result.parseError) {
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/questions/import/validate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: result.rawItems }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportValidationResult;
      setServerValidation(data);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    setCommitResult(null);
    setServerError(null);

    if (result.parseError) {
      return;
    }

    setCommitting(true);
    try {
      const response = await fetch('/api/questions/import/commit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: result.rawItems }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportCommitResult;
      setCommitResult(data);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <div className="border-b border-black/10 pb-4 dark:border-white/10">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isZh ? 'JSON 输入区' : 'JSON Input'}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {isZh ? `总数 ${validationSummary.total}` : `Total ${validationSummary.total}`}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {isZh ? `通过 ${validationSummary.valid}` : `Valid ${validationSummary.valid}`}
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {isZh ? `错误 ${validationSummary.invalid}` : `Invalid ${validationSummary.invalid}`}
                </span>
                {commitResult ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {isZh ? `已入库 ${commitResult.successCount}` : `Imported ${commitResult.successCount}`}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => {
                setSource(sampleJson);
                setSubmitted(false);
                setServerValidation(null);
                setCommitResult(null);
                setServerError(null);
              }}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {isZh ? '重置' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={() => void handleValidate()}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {validating
                ? isZh
                  ? '校验中...'
                  : 'Loading...'
                : isZh
                  ? '校验'
                  : 'Validate'}
            </button>
            <button
              type="button"
              onClick={() => void handleCommit()}
              disabled={!commitEnabled}
              className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {committing
                ? isZh
                  ? '入库中...'
                  : 'Loading...'
                : isZh
                  ? '确认批量入库'
                  : 'Commit'}
            </button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setSubmitted(false);
              setServerValidation(null);
              setCommitResult(null);
              setServerError(null);
            }}
            rows={22}
            className="min-h-128 w-full rounded-3xl border border-black/10 bg-slate-50 px-4 py-4 font-mono text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
        {submitted && result.parseError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {result.parseError}
          </div>
        ) : null}
        {serverError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {serverError}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isZh ? '不通过原因汇总' : 'Top Validation Errors'}
        </h2>
        {!submitted ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {isZh ? '点击“校验”后在这里查看错误原因汇总。' : 'Run validation to view summarized errors here.'}
          </div>
        ) : !result.parseError && invalidReasons.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-950/40">
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {invalidReasons.slice(0, 8).map((item) => (
                  <div key={item.reason} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 wrap-break-word">{item.reason}</span>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                      ×{item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {isZh ? '当前没有需要展示的错误原因。' : 'There are no validation errors to display.'}
          </div>
        )}
      </div>
    </div>
  );
}
