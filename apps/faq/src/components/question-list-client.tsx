'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FileDownIcon, SettingsIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { GradientButton } from '@windrun-huaiin/third-ui/main/buttons';
import type { QuestionListItemCopy } from './question-copy';
import { QuestionList } from './question-list';
import { QuestionListFilters } from './question-list-filters';
import { QuestionListSkeleton } from './question-skeleton-blocks';
import type { QuestionListItemDto, QuestionListResult } from '@/server/questions/types';

type QuestionListClientProps = {
  locale: string;
  copy: {
    filters: {
      categoryLabel: string;
      categoryAll: string;
      subCategoryLabel: string;
      subCategoryAll: string;
      difficultyLabel: string;
      difficultyAll: string;
      questionLabel: string;
      questionPlaceholder: string;
      correctAnswerLabel: string;
      correctAnswerPlaceholder: string;
      dateRangeLabel: string;
      dateRangePlaceholder: string;
      advancedToggle: string;
      idLabel: string;
      idPlaceholder: string;
      uuidLabel: string;
      uuidPlaceholder: string;
      firstLabel: string;
    };
    loading: string;
    loadFailed: string;
    pagination: {
      summary: string;
      previous: string;
      next: string;
      enterPage: string;
      enterPageHint: string;
      jumpToLast: string;
      total: string;
    };
    export: {
      settingsLabel: string;
      buttonLabel: string;
      loadingLabel: string;
      dialogTitle: string;
      settingsAriaLabel: string;
      closeAriaLabel: string;
      confirm: string;
      cancel: string;
      failed: string;
      columns: {
        id: string;
        questionUuid: string;
        category: string;
        subCategory: string;
        asFirst: string;
      };
    };
    item: QuestionListItemCopy;
  };
};

type ListState = {
  items: QuestionListItemDto[];
  pagination: QuestionListResult['pagination'];
  loading: boolean;
  error: string | null;
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function buildQuery(params: {
  question: string;
  correctAnswer: string;
  createdAtFrom: string;
  createdAtTo: string;
  id: string;
  uuid: string;
  asFirst: boolean;
  category: string;
  subCategory: string;
  difficulty: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.question.trim()) searchParams.set('question', params.question.trim());
  if (params.correctAnswer.trim()) searchParams.set('correctAnswer', params.correctAnswer.trim());
  if (params.createdAtFrom.trim()) searchParams.set('createdAtFrom', params.createdAtFrom.trim());
  if (params.createdAtTo.trim()) searchParams.set('createdAtTo', params.createdAtTo.trim());
  if (params.id.trim()) searchParams.set('id', params.id.trim());
  if (params.uuid.trim()) searchParams.set('uuid', params.uuid.trim());
  if (params.asFirst) searchParams.set('asFirst', 'true');
  if (params.category.trim()) searchParams.set('category', params.category.trim());
  if (params.subCategory.trim()) searchParams.set('subCategory', params.subCategory.trim());
  if (params.difficulty.trim()) searchParams.set('difficulty', params.difficulty.trim());
  return searchParams;
}

function buildListQuery(params: {
  page: number;
  question: string;
  correctAnswer: string;
  createdAtFrom: string;
  createdAtTo: string;
  id: string;
  uuid: string;
  asFirst: boolean;
  category: string;
  subCategory: string;
  difficulty: string;
}) {
  const searchParams = buildQuery(params);
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', '20');
  return searchParams.toString();
}

const REQUIRED_EXPORT_COLUMNS = ['id', 'question_uuid', 'category', 'as_first'] as const;
const OPTIONAL_EXPORT_COLUMNS = ['sub_category'] as const;
const DEFAULT_EXPORT_COLUMNS = [...REQUIRED_EXPORT_COLUMNS, ...OPTIONAL_EXPORT_COLUMNS] as const;
type ExportColumn = (typeof DEFAULT_EXPORT_COLUMNS)[number];

const REQUIRED_EXPORT_COLUMN_SET = new Set<ExportColumn>(REQUIRED_EXPORT_COLUMNS);

export function QuestionListClient({ locale, copy }: QuestionListClientProps) {
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [createdAtFrom, setCreatedAtFrom] = useState('');
  const [createdAtTo, setCreatedAtTo] = useState('');
  const [id, setId] = useState('');
  const [uuid, setUuid] = useState('');
  const [asFirst, setAsFirst] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<ExportColumn[]>([...DEFAULT_EXPORT_COLUMNS]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('1');
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<ListState>({
    items: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    },
    loading: true,
    error: null,
  });

  const queryString = useMemo(
    () => buildListQuery({
      page,
      question,
      correctAnswer,
      createdAtFrom,
      createdAtTo,
      id,
      uuid,
      asFirst,
      category,
      subCategory,
      difficulty,
    }),
    [page, question, correctAnswer, createdAtFrom, createdAtTo, id, uuid, asFirst, category, subCategory, difficulty]
  );
  const normalizedIdInput = id.trim();
  const normalizedIdValue =
    normalizedIdInput.length > 0 && /^\d+$/.test(normalizedIdInput)
      ? Number(normalizedIdInput.replace(/^0+/, '') || '0')
      : null;
  const hasInvalidId =
    normalizedIdInput.length > 0 &&
    (normalizedIdValue === null || !Number.isInteger(normalizedIdValue) || normalizedIdValue < 10000);
  const normalizedUuid = uuid.trim().toLowerCase();
  const hasInvalidUuid = normalizedUuid.length > 0 && !isValidUuid(normalizedUuid);
  const maxPage = Math.max(state.pagination.totalPages, 1);
  const normalizedPageInput = pageInput.trim();
  const hasInvalidPageInput =
    normalizedPageInput.length > 0 &&
    (!/^\d+$/.test(normalizedPageInput) || Number(normalizedPageInput) < 1 || Number(normalizedPageInput) > maxPage);

  function resetPageAndExportError() {
    setPage(1);
    setPageInput('1');
    setExportError(null);
  }

  function changePage(nextPage: number) {
    const safePage = Math.max(1, Math.min(maxPage, nextPage));
    setPage(safePage);
    setPageInput(String(safePage));
  }

  function updateFilter(update: () => void) {
    update();
    resetPageAndExportError();
  }

  function toggleExportColumn(column: ExportColumn) {
    if (REQUIRED_EXPORT_COLUMN_SET.has(column)) {
      return;
    }

    setExportError(null);
    setSelectedExportColumns((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column]
    );
  }

  function clearAllFilters() {
    setQuestion('');
    setCorrectAnswer('');
    setCreatedAtFrom('');
    setCreatedAtTo('');
    setId('');
    setUuid('');
    setAsFirst(false);
    setCategory('');
    setSubCategory('');
    setDifficulty('');
    resetPageAndExportError();
  }

  async function handleExport() {
    if (hasInvalidId || hasInvalidUuid || exporting) {
      return;
    }

    setExporting(true);
    setExportError(null);

    try {
      const searchParams = buildQuery({
        question,
        correctAnswer,
        createdAtFrom,
        createdAtTo,
        id,
        uuid,
        asFirst,
        category,
        subCategory,
        difficulty,
      });
      searchParams.set('columns', selectedExportColumns.join(','));

      const response = await fetch(`/api/questions/export?${searchParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const disposition = response.headers.get('Content-Disposition') ?? '';
      const fileNameMatch = disposition.match(/filename="([^"]+)"/);
      const fileName = fileNameMatch?.[1] ?? `ay-${Date.now()}-query.csv`;
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  function handlePageInputChange(value: string) {
    const digitsOnly = value.replace(/\D+/g, '');

    if (!digitsOnly) {
      setPageInput('');
      return;
    }

    const normalized = digitsOnly.replace(/^0+/, '');
    if (!normalized) {
      setPageInput('');
      return;
    }

    if (Number(normalized) > maxPage) {
      return;
    }

    setPageInput(normalized);
  }

  function normalizePageInput() {
    if (!normalizedPageInput) {
      setPageInput(String(page));
      return;
    }

    if (!hasInvalidPageInput) {
      const nextPage = Number(normalizedPageInput);
      if (nextPage !== page) {
        changePage(nextPage);
        return;
      }
    }

    setPageInput(String(page));
  }

  const exportColumns = [
    { key: 'id' as const, label: copy.export.columns.id, required: true },
    { key: 'question_uuid' as const, label: copy.export.columns.questionUuid, required: true },
    { key: 'category' as const, label: copy.export.columns.category, required: true },
    { key: 'as_first' as const, label: copy.export.columns.asFirst, required: true },
    { key: 'sub_category' as const, label: copy.export.columns.subCategory, required: false },
  ];

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      if (hasInvalidId || hasInvalidUuid) {
        setState({
          items: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          },
          loading: false,
          error: null,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(`/api/questions?${queryString}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (response.status === 400) {
          setState({
            items: [],
            pagination: {
              page: 1,
              pageSize: 20,
              total: 0,
              totalPages: 0,
            },
            loading: false,
            error: null,
          });
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as QuestionListResult;
        setState({
          items: data.items ?? [],
          pagination: data.pagination ?? {
            page: 1,
            pageSize: 20,
            total: data.items?.length ?? 0,
            totalPages: 1,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          items: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          },
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    void run();

    return () => controller.abort();
  }, [hasInvalidId, hasInvalidUuid, queryString, reloadKey]);

  return (
    <div className="flex min-h-[calc(100vh-18rem)] flex-col gap-4">
      <div className="mb-4 sm:mb-5">
        <QuestionListFilters
          question={question}
          correctAnswer={correctAnswer}
          createdAtFrom={createdAtFrom}
          createdAtTo={createdAtTo}
          id={id}
          idInvalid={hasInvalidId}
          uuid={uuid}
          uuidInvalid={hasInvalidUuid}
          asFirst={asFirst}
          category={category}
          subCategory={subCategory}
          difficulty={difficulty}
          copy={copy.filters}
          onQuestionChange={(value) => updateFilter(() => setQuestion(value))}
          onCorrectAnswerChange={(value) => updateFilter(() => setCorrectAnswer(value))}
          onCreatedAtFromChange={(value) => updateFilter(() => setCreatedAtFrom(value))}
          onCreatedAtToChange={(value) => updateFilter(() => setCreatedAtTo(value))}
          onIdChange={(value) => updateFilter(() => setId(value))}
          onUuidChange={(value) => updateFilter(() => setUuid(value))}
          onAsFirstChange={(value) => updateFilter(() => setAsFirst(value))}
          onCategoryChange={(value) => updateFilter(() => setCategory(value))}
          onSubCategoryChange={(value) => updateFilter(() => setSubCategory(value))}
          onDifficultyChange={(value) => updateFilter(() => setDifficulty(value))}
          onClearAll={clearAllFilters}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {state.loading ? <QuestionListSkeleton label={copy.loading} /> : null}

        {state.error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {copy.loadFailed}
            {state.error}
          </div>
        ) : null}

        {!state.loading && !state.error ? (
          <QuestionList
            locale={locale}
            items={state.items}
            copy={copy.item}
            questionHighlight={question}
            correctAnswerHighlight={correctAnswer}
            onDeleted={() => setReloadKey((current) => current + 1)}
          />
        ) : null}

        {!state.loading && !state.error ? (
          <div className="space-y-3">
            {exportError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {copy.export.failed}
                {exportError}
              </div>
            ) : null}
            <div className="grid gap-3 rounded-3xl border border-black/10 px-3 py-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300 sm:px-4 sm:text-sm lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <div className="hidden lg:block" />
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={state.pagination.page <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-slate-600 transition hover:border-black/20 hover:bg-black/5 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label={copy.pagination.previous}
                  title={copy.pagination.previous}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pageInput}
                    onChange={(event) => handlePageInputChange(event.target.value)}
                    onBlur={normalizePageInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        normalizePageInput();
                      }
                    }}
                    aria-label={copy.pagination.enterPage}
                    title={copy.pagination.enterPageHint}
                    className={`h-8 w-14 rounded-lg bg-transparent px-2 text-center text-sm outline-none transition ${
                      hasInvalidPageInput
                        ? 'border border-red-300 focus:border-red-400 hover:border-red-400 dark:border-red-400/60 dark:hover:border-red-400 dark:focus:border-red-400'
                        : 'border border-black/10 hover:border-black/20 focus:border-black/20 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-white/20'
                    }`}
                  />
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => changePage(maxPage)}
                    className="rounded-md px-1.5 py-0.5 text-sm transition hover:bg-black/5 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
                    title={copy.pagination.jumpToLast}
                  >
                    {maxPage}
                  </button>
                  <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {copy.pagination.total.replace('{total}', String(state.pagination.total))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={state.pagination.totalPages <= 1 || state.pagination.page >= state.pagination.totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-slate-600 transition hover:border-black/20 hover:bg-black/5 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label={copy.pagination.next}
                  title={copy.pagination.next}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  disabled={hasInvalidId || hasInvalidUuid}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                  aria-label={copy.export.settingsAriaLabel}
                  title={copy.export.settingsAriaLabel}
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>
                <GradientButton
                  onClick={() => void handleExport()}
                  disabled={hasInvalidId || hasInvalidUuid || exporting}
                  title={copy.export.buttonLabel}
                  loadingText={copy.export.loadingLabel}
                  align="center"
                  icon={<FileDownIcon/>}
                  className="sm:w-auto"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.export.dialogTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label={copy.export.closeAriaLabel}
                title={copy.export.closeAriaLabel}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {exportColumns.map((column) => {
                const checked = selectedExportColumns.includes(column.key);

                return (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition ${
                      column.required
                        ? 'border-black/10 bg-slate-50 dark:border-white/10 dark:bg-white/5'
                        : 'border-black/10 hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={column.required}
                      onChange={() => toggleExportColumn(column.key)}
                      className="h-4 w-4 rounded border-black/10"
                    />
                    <span className="flex-1 text-slate-800 dark:text-slate-100">{column.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
