'use client';

import { useMemo, useRef, useState } from 'react';
import { BookmarkCheckIcon, BookmarkXIcon, ChartColumnStackedIcon, CheckCheckIcon, DatabaseZapIcon, JsonIcon, RotateCcwIcon, ScanSearchIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { GradientButton } from '@windrun-huaiin/third-ui/main/buttons';
import type {
  QuestionImportCommitResult,
  QuestionImportValidationItem,
  QuestionImportValidationResult,
} from '@/server/questions/types';
import { splitAnswerOptionDrafts, type QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionImportCopy } from './question-copy';
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

function renderCountBadge(count: number, tone: 'neutral' | 'success' | 'danger') {
  const toneClassName =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'danger'
        ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300';

  return <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${toneClassName}`}>{count}</span>;
}
export function QuestionImportClient({ copy }: { copy: QuestionImportCopy }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toFixRef = useRef<HTMLDivElement | null>(null);
  const [source, setSource] = useState(sampleJson);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [revalidatingItemId, setRevalidatingItemId] = useState<string | null>(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [validatedItems, setValidatedItems] = useState<QuestionImportValidationItem[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [currentInvalidIndex, setCurrentInvalidIndex] = useState(0);
  const [commitResult, setCommitResult] = useState<QuestionImportCommitResult | null>(null);

  const result = useMemo(() => parseImportText(source), [source]);
  const invalidItems = useMemo(() => validatedItems.filter((item) => !item.valid), [validatedItems]);
  const currentInvalidItem = invalidItems[currentInvalidIndex] ?? null;

  const totalCount = hasValidated ? validatedItems.length : result.rawItems.length;
  const validCount = hasValidated ? validatedItems.filter((item) => item.valid).length : 0;
  const invalidCount = hasValidated ? invalidItems.length : 0;
  const importedCount = commitResult?.successCount ?? 0;
  const commitEnabled = hasValidated && totalCount > 0 && invalidCount === 0;

  function resetValidationState() {
    setValidatedItems([]);
    setHasValidated(false);
    setCurrentInvalidIndex(0);
    setCommitResult(null);
    setErrorDialogMessage(null);
    setSuccessDialogOpen(false);
    setImportCompleted(false);
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
      setErrorDialogMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!commitEnabled || result.parseError) {
      return;
    }

    setCommitting(true);
    setErrorDialogMessage(null);
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
      setImportCompleted(true);
      setSuccessDialogOpen(true);
    } catch (error) {
      setErrorDialogMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCommitting(false);
    }
  }

  async function handleRevalidateCurrent() {
    if (!currentInvalidItem) {
      return;
    }

    setRevalidatingItemId(currentInvalidItem.importId);
    setErrorDialogMessage(null);

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
      setErrorDialogMessage(error instanceof Error ? error.message : 'Unknown error');
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
      setErrorDialogMessage(copy.errors.jsonOnly);
      return;
    }

    try {
      const text = await file.text();
      setSource(text);
      resetValidationState();
    } catch (error) {
      setErrorDialogMessage(error instanceof Error ? error.message : 'Failed to read file');
    }
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
            <div className="flex min-w-max items-center justify-center gap-1.5">
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5 md:min-w-[84px] md:gap-2 md:px-3 md:py-1.5">
                <ChartColumnStackedIcon className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-300 md:h-4 md:w-4" aria-hidden="true" />
                {renderCountBadge(totalCount, 'neutral')}
              </div>
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5 md:min-w-[84px] md:gap-2 md:px-3 md:py-1.5">
                <BookmarkCheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300 md:h-4 md:w-4" aria-hidden="true" />
                {renderCountBadge(validCount, 'success')}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (invalidCount > 0) {
                    scrollToToFix();
                  }
                }}
                className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5 md:min-w-[84px] md:gap-2 md:px-3 md:py-1.5"
              >
                <BookmarkXIcon className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-300 md:h-4 md:w-4" aria-hidden="true" />
                {renderCountBadge(invalidCount, 'danger')}
              </button>
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5 md:min-w-[84px] md:gap-2 md:px-3 md:py-1.5">
                <DatabaseZapIcon className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300 md:h-4 md:w-4" aria-hidden="true" />
                {renderCountBadge(importedCount, importedCount > 0 ? 'success' : 'neutral')}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-center">
            <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:flex md:flex-wrap md:items-center">
              <GradientButton
                onClick={() => fileInputRef.current?.click()}
                title={copy.toolbar.uploadJson}
                align="center"
                variant="subtle"
                className="w-full md:min-w-[120px] md:w-auto"
                icon={<JsonIcon className="h-4 w-4"/>}
              />
              <GradientButton
                onClick={() => {
                  setSource(sampleJson);
                  resetValidationState();
                }}
                title={copy.toolbar.loadSample}
                align="center"
                variant="subtle"
                className="w-full md:min-w-[120px] md:w-auto"
                icon={<RotateCcwIcon className="h-4 w-4"/>}
              />
            </div>

            <div className="hidden h-9 w-px shrink-0 bg-black/10 dark:bg-white/10 md:block" />

            <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:flex md:flex-wrap md:items-center md:justify-center">
              <div className="flex w-full md:w-auto">
                <GradientButton
                  onClick={() => void handleValidate()}
                  disabled={validating || importCompleted}
                  title={copy.toolbar.validateAll}
                  loadingText={copy.toolbar.validating}
                  align="center"
                  variant="soft"
                  className="w-full md:min-w-[120px] md:w-auto"
                  icon={<ScanSearchIcon className="h-4 w-4"/>}
                />
              </div>
              <div className="flex w-full md:w-auto">
                <GradientButton
                  onClick={() => void handleCommit()}
                  disabled={committing || !commitEnabled || importCompleted}
                  title={copy.toolbar.import}
                  loadingText={copy.toolbar.importing}
                  align="center"
                  className="w-full md:min-w-[120px] md:w-auto"
                  icon={<CheckCheckIcon className="h-4 w-4"/>}
                />
              </div>
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
      </div>

      {hasValidated && invalidCount > 0 && currentInvalidItem ? (
        <div ref={toFixRef}>
          <QuestionImportToFix
            item={currentInvalidItem}
            index={currentInvalidIndex}
            total={invalidCount}
            revalidating={revalidatingItemId === currentInvalidItem.importId}
            copy={copy.workbench}
            formCopy={copy.form}
            onPrevious={() => setCurrentInvalidIndex((index) => Math.max(index - 1, 0))}
            onNext={() => setCurrentInvalidIndex((index) => Math.min(index + 1, invalidCount - 1))}
            onRemove={handleRemoveCurrent}
            onRevalidate={() => void handleRevalidateCurrent()}
            onChange={updateCurrentItemFromForm}
            onAnswerOptionsChange={updateCurrentAnswerOptions}
          />
        </div>
      ) : null}

      {errorDialogMessage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onClick={() => setErrorDialogMessage(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.errors.dialogTitle}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{errorDialogMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorDialogMessage(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label={copy.errors.closeAriaLabel}
                title={copy.errors.closeAriaLabel}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successDialogOpen && commitResult ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onClick={() => setSuccessDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.result.dialogTitle}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {copy.result.success.replace('{count}', String(commitResult.successCount))}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{copy.result.dialogDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessDialogOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label={copy.errors.closeAriaLabel}
                title={copy.errors.closeAriaLabel}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
