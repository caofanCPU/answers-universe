'use client';

import { useMemo, useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';
import { XButton } from '@windrun-huaiin/third-ui/main';
import type {
  QuestionImportCommitResult,
  QuestionImportDisplayFieldKey,
  QuestionImportValidationItem,
  QuestionImportValidationResult,
} from '@/server/questions/types';
import { splitAnswerOptionDrafts, type QuestionAnswerOptionDraft } from './question-answer-options';
import { QuestionImportToFix } from './question-import-to-fix';
import {
  ensureImportIds,
  normalizeImportItemAliases,
  parseImportText,
  stringifyItems,
  toRequestItem,
  type RawImportItem,
} from './question-import-shared';
import type { QuestionFormValues } from './question-ui-types';

const sampleJson = `[
  {
    "question": "Which USB connector is reversible and commonly used by modern laptops and phones?",
    "correctAnswer": "USB-C",
    "correctAnswerIndex": 0,
    "incorrectAnswers": ["USB-A", "Mini USB", "Micro USB"],
    "explanation": "USB-C is reversible and widely adopted in modern devices.",
    "difficulty": "easy",
    "category": "Tech & Innovation",
    "subCategory": "science",
    "tags": ["usb", "connector", "hardware"],
    "asFirst": true
  }
]`;


function getDisplayFieldLabel(key: QuestionImportDisplayFieldKey, isZh: boolean): string {
  return key === 'fullInsertSql' ? (isZh ? '完整 SQL' : 'Full SQL') : isZh ? '完整 UUID SQL' : 'Full UUID SQL';
}

function renderCountBadge(count: number, tone: 'neutral' | 'success' | 'danger') {
  const toneClassName =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'danger'
        ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300';

  return <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${toneClassName}`}>{count}</span>;
}


export function QuestionImportClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const toFixRef = useRef<HTMLDivElement | null>(null);
  const [source, setSource] = useState(sampleJson);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [revalidatingItemId, setRevalidatingItemId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validatedItems, setValidatedItems] = useState<QuestionImportValidationItem[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [currentInvalidIndex, setCurrentInvalidIndex] = useState(0);
  const [commitResult, setCommitResult] = useState<QuestionImportCommitResult | null>(null);
  const [copiedField, setCopiedField] = useState<QuestionImportDisplayFieldKey | null>(null);

  const result = useMemo(() => parseImportText(source), [source]);
  const invalidItems = useMemo(() => validatedItems.filter((item) => !item.valid), [validatedItems]);
  const currentInvalidItem = invalidItems[currentInvalidIndex] ?? null;

  const totalCount = hasValidated ? validatedItems.length : result.rawItems.length;
  const validCount = hasValidated ? validatedItems.filter((item) => item.valid).length : 0;
  const invalidCount = hasValidated ? invalidItems.length : 0;
  const commitEnabled = hasValidated && totalCount > 0 && invalidCount === 0;

  function resetValidationState() {
    setValidatedItems([]);
    setHasValidated(false);
    setCurrentInvalidIndex(0);
    setCommitResult(null);
    setServerError(null);
  }

  function replaceSourceItems(items: RawImportItem[]) {
    setSource(stringifyItems(items));
  }

  function syncValidatedItems(items: QuestionImportValidationItem[]) {
    setValidatedItems(items);
    setHasValidated(true);
    setCurrentInvalidIndex((index) => Math.min(index, Math.max(items.filter((item) => !item.valid).length - 1, 0)));
  }

  function scrollToToFix() {
    toFixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateItemInSource(importId: string, updater: (item: RawImportItem) => RawImportItem) {
    const parsed = parseImportText(source);
    if (parsed.parseError) {
      return;
    }

    const nextItems = parsed.rawItems.map((item) => {
      const normalized = normalizeImportItemAliases(item);
      return normalized.importId === importId ? updater(normalized) : normalized;
    });

    replaceSourceItems(nextItems);
  }

  function updateValidatedItem(importId: string, updater: (item: QuestionImportValidationItem) => QuestionImportValidationItem) {
    setValidatedItems((items) => items.map((item) => (item.importId === importId ? updater(item) : item)));
  }

  function updateCurrentItemFromForm(nextValues: QuestionFormValues) {
    if (!currentInvalidItem) {
      return;
    }

    updateValidatedItem(currentInvalidItem.importId, (item) => ({
      ...item,
      question: nextValues.question,
      cdnImagePrefix: nextValues.cdnImagePrefix,
      questionImage: nextValues.questionImage,
      explanation: nextValues.explanation,
      difficulty: nextValues.difficulty,
      category: nextValues.category,
      subCategory: nextValues.subCategory || null,
      tags: nextValues.tags,
      asFirst: nextValues.asFirst,
    }));

    updateItemInSource(currentInvalidItem.importId, (item) => ({
      ...item,
      question: nextValues.question,
      cdnImagePrefix: nextValues.cdnImagePrefix,
      questionImage: nextValues.questionImage,
      explanation: nextValues.explanation,
      difficulty: nextValues.difficulty,
      category: nextValues.category,
      subCategory: nextValues.subCategory || null,
      tags: nextValues.tags,
      asFirst: nextValues.asFirst,
    }));
  }

  function updateCurrentAnswerOptions(nextOptions: QuestionAnswerOptionDraft[]) {
    if (!currentInvalidItem) {
      return;
    }

    const nextAnswers = splitAnswerOptionDrafts(nextOptions);

    updateValidatedItem(currentInvalidItem.importId, (item) => ({
      ...item,
      correctAnswer: nextAnswers.correctAnswer,
      correctAnswerIndex: nextAnswers.correctAnswerIndex,
      incorrectAnswers: nextAnswers.incorrectAnswers,
    }));

    updateItemInSource(currentInvalidItem.importId, (item) => ({
      ...item,
      correctAnswer: nextAnswers.correctAnswer,
      correctAnswerIndex: nextAnswers.correctAnswerIndex,
      incorrectAnswers: nextAnswers.incorrectAnswers,
    }));
  }

  async function handleValidate() {
    resetValidationState();

    if (result.parseError) {
      return;
    }

    const items = ensureImportIds(result.rawItems);
    replaceSourceItems(items);
    setValidating(true);

    try {
      const response = await fetch('/api/questions/import/validate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportValidationResult;
      syncValidatedItems(data.items);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!commitEnabled || result.parseError) {
      return;
    }

    setCommitting(true);
    setServerError(null);
    setCommitResult(null);

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

  async function handleRevalidateCurrent() {
    if (!currentInvalidItem) {
      return;
    }

    setRevalidatingItemId(currentInvalidItem.importId);
    setServerError(null);

    try {
      const response = await fetch('/api/questions/import/validate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [toRequestItem(currentInvalidItem)] }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportValidationResult;
      const nextItem = data.items[0];

      setValidatedItems((items) => items.map((item) => (item.importId === nextItem.importId ? nextItem : item)));
      setCurrentInvalidIndex((index) => Math.min(index, Math.max(invalidItems.length - (nextItem.valid ? 2 : 1), 0)));
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setRevalidatingItemId(null);
    }
  }

  function handleRemoveCurrent() {
    if (!currentInvalidItem) {
      return;
    }

    const parsed = parseImportText(source);
    if (parsed.parseError) {
      return;
    }

    replaceSourceItems(
      parsed.rawItems.filter((item) => normalizeImportItemAliases(item).importId !== currentInvalidItem.importId)
    );
    setValidatedItems((items) => items.filter((item) => item.importId !== currentInvalidItem.importId));
    setCurrentInvalidIndex((index) => Math.max(index - (index >= invalidItems.length - 1 ? 1 : 0), 0));
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.trim().toLowerCase().endsWith('.json')) {
      setServerError(isZh ? '仅支持上传 JSON 文件。' : 'Only JSON files are supported.');
      return;
    }

    try {
      const text = await file.text();
      setSource(text);
      resetValidationState();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to read file');
    }
  }

  async function copyText(field: QuestionImportDisplayFieldKey, value: string) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedField(field);

    if (copyResetTimerRef.current) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopiedField(null);
      copyResetTimerRef.current = null;
    }, 1400);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => void handleFileSelect(event)}
        />
        <div className="space-y-3 border-b border-black/10 pb-4 dark:border-white/10">
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center justify-center gap-1.5 md:justify-start">
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <span className="text-xs" aria-hidden="true">📊</span>
                {renderCountBadge(totalCount, 'neutral')}
              </div>
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <span className="text-xs" aria-hidden="true">✅</span>
                {renderCountBadge(validCount, 'success')}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (invalidCount > 0) {
                    scrollToToFix();
                  }
                }}
                className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5"
              >
                <span className="text-xs" aria-hidden="true">❌</span>
                {renderCountBadge(invalidCount, 'danger')}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className="px-4 py-2.5"
              button={{
                icon: false,
                text: isZh ? '上传 JSON' : 'Upload JSON',
                onClick: () => fileInputRef.current?.click(),
              }}
            />
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className="px-4 py-2.5"
              button={{
                icon: false,
                text: isZh ? '载入示例' : 'Load Sample',
                onClick: () => {
                  setSource(sampleJson);
                  resetValidationState();
                },
              }}
            />
            <XButton
              type="single"
              variant="subtle"
              minWidth="min-w-0"
              className="px-4 py-2.5"
              loadingText={isZh ? '校验中...' : 'Loading...'}
              button={{
                icon: false,
                text: isZh ? '校验全部' : 'Validate All',
                onClick: () => void handleValidate(),
                disabled: validating,
              }}
            />
            <div className="flex w-full justify-center md:w-auto md:justify-start">
              <GradientButton
                onClick={() => void handleCommit()}
                disabled={committing || !commitEnabled}
                title={isZh ? '导入' : 'Import'}
                loadingText={isZh ? '导入中...' : 'Loading...'}
                align="center"
                icon=<icons.CheckCheck/>
                className="sm:w-auto"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <textarea
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              resetValidationState();
            }}
            rows={20}
            className="min-h-128 w-full rounded-3xl border border-black/10 bg-slate-50 px-4 py-4 font-mono text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {result.parseError ? (
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

      {hasValidated && invalidCount > 0 && currentInvalidItem ? (
        <div ref={toFixRef}>
          <QuestionImportToFix
            locale={locale}
            item={currentInvalidItem}
            index={currentInvalidIndex}
            total={invalidCount}
            revalidating={revalidatingItemId === currentInvalidItem.importId}
            onPrevious={() => setCurrentInvalidIndex((index) => Math.max(index - 1, 0))}
            onNext={() => setCurrentInvalidIndex((index) => Math.min(index + 1, invalidCount - 1))}
            onRemove={handleRemoveCurrent}
            onRevalidate={() => void handleRevalidateCurrent()}
            onChange={updateCurrentItemFromForm}
            onAnswerOptionsChange={updateCurrentAnswerOptions}
          />
        </div>
      ) : null}


      {commitResult ? (
        <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isZh ? '导入结果' : 'Import Result'}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {isZh ? `总计 ${commitResult.total}` : `Total ${commitResult.total}`}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {isZh ? `成功 ${commitResult.successCount}` : `Success ${commitResult.successCount}`}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {commitResult.displayFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {getDisplayFieldLabel(field.key, isZh)}
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(field.key, field.value)}
                    className="inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-black/20 hover:bg-black/5 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {copiedField === field.key ? <icons.X className="h-3.5 w-3.5" /> : <icons.Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === field.key ? 'Copied' : isZh ? '复制' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={field.value}
                  rows={field.key === 'fullInsertSql' ? 6 : 4}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
