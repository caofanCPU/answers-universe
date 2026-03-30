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
  questionImage?: unknown;
  correctAnswer?: unknown;
  correctAnswerIndex?: unknown;
  incorrectAnswers?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  category?: unknown;
  subCategory?: unknown;
  tags?: unknown;
  keywords?: unknown;
  isFirst?: unknown;
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
    "difficulty": "Easy",
    "category": "Hardware",
    "subCategory": "USB Basics",
    "tags": ["usb", "connector", "hardware"],
    "isFirst": true
  }
]`;

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
  const errors: string[] = [];
  const question = normalizeString(item.question);
  const category = normalizeString(item.category);
  const subCategory = normalizeString(item.subCategory);
  const difficulty = normalizeString(item.difficulty);
  const correctAnswer = normalizeString(item.correctAnswer);
  const correctAnswerIndex = normalizeInteger(item.correctAnswerIndex);
  const explanation = normalizeString(item.explanation);
  const tags = normalizeTags(item.tags);
  const keywords = normalizeTags(item.keywords);

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
  if (item.correctAnswerIndex !== undefined && correctAnswerIndex === null) {
    errors.push('correctAnswerIndex must be an integer');
  }
  if (!explanation) errors.push('explanation is required');

  if (!Array.isArray(item.incorrectAnswers)) {
    errors.push('incorrectAnswers must be an array');
  } else {
    const validIncorrectAnswers = item.incorrectAnswers.filter(
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

    const rawItems = parsed as RawImportItem[];
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isZh ? 'JSON 输入区' : 'JSON Input'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isZh
                ? '这一步只在前端本地解析 JSON，不会请求后端。你可以直接粘贴测试数据并查看本地预览结果。'
                : 'This step parses JSON locally in the frontend only. No backend request is made yet.'}
            </p>
          </div>
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
            className="w-full rounded-3xl border border-black/10 bg-slate-50 px-4 py-4 font-mono text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleValidate()}
              className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110"
            >
              {validating
                ? isZh
                  ? '后端校验中...'
                  : 'Validating...'
                : isZh
                  ? '解析并校验'
                  : 'Parse and Validate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSource(sampleJson);
                setSubmitted(false);
              }}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {isZh ? '恢复示例数据' : 'Reset Sample'}
            </button>
            <button
              type="button"
              onClick={() => void handleCommit()}
              disabled={
                committing ||
                !!result.parseError ||
                result.rawItems.length === 0 ||
                (serverValidation ? serverValidation.invalidCount > 0 : false)
              }
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {committing
                ? isZh
                  ? '批量入库中...'
                  : 'Committing...'
                : isZh
                  ? '批量入库'
                  : 'Commit Import'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isZh ? '解析结果摘要' : 'Parse Summary'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {isZh ? '总数' : 'Total'}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.total}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                {isZh ? '可导入' : 'Valid'}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.valid}</div>
            </div>
            <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
              <div className="text-xs uppercase tracking-[0.2em] text-red-700 dark:text-red-300">
                {isZh ? '错误' : 'Invalid'}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.invalid}</div>
            </div>
          </div>

          {submitted && result.parseError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {result.parseError}
            </div>
          ) : null}

          {serverValidation ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <div className="font-semibold">{isZh ? '后端校验结果' : 'Backend Validation'}</div>
              <div className="mt-2">
                {isZh ? '可导入：' : 'Valid: '}
                {serverValidation.validCount}
                {' / '}
                {serverValidation.total}
              </div>
              <div>
                {isZh ? '错误：' : 'Invalid: '}
                {serverValidation.invalidCount}
              </div>
            </div>
          ) : null}

          {commitResult ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="font-semibold">{isZh ? '批量入库结果' : 'Commit Result'}</div>
              <div className="mt-2">
                {isZh ? '成功：' : 'Success: '}
                {commitResult.successCount}
              </div>
              <div>
                {isZh ? '失败：' : 'Failed: '}
                {commitResult.failedCount}
              </div>
            </div>
          ) : null}

          {serverError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {serverError}
            </div>
          ) : null}

          {!submitted ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {isZh ? '点击“解析并预览”后显示本地解析结果。' : 'Click "Parse and Preview" to show local parse results.'}
            </div>
          ) : null}
        </div>
      </div>

      {submitted && !result.parseError ? (
        <div className="lg:col-span-2 space-y-4">
          {(serverValidation?.items ?? result.previews).map((item) => (
            <article
              key={`${item.index}-${item.question}`}
              className="rounded-3xl border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      #{item.index + 1}
                    </span>
                    <span
                      className={
                        item.valid
                          ? 'rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      }
                    >
                      {item.valid ? (isZh ? '可导入' : 'Valid') : isZh ? '存在错误' : 'Invalid'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {item.category || '--'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {item.difficulty || '--'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.question || (isZh ? '未提供题干' : 'Missing question')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={`${item.index}-${tag}`}
                        className="rounded-full border border-black/10 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {!item.valid ? (
                  <div className="min-w-[260px] rounded-2xl bg-red-50 px-4 py-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">
                    <div className="font-semibold">{isZh ? '错误原因' : 'Errors'}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {item.errors.map((error) => (
                        <li key={`${item.index}-${error}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
