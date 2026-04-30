'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookCheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleStopIcon, CopyIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';
import { GradientButton, XButton, XToggleButton } from '@windrun-huaiin/third-ui/main/buttons';
import { buildReadonlyAnswerOptions } from './question-answer-options';
import { QuestionDetail } from './question-detail';
import type {
  RandomQuestionAnalysisResult,
  RandomQuestionCategoryInventory,
  RandomQuestionDetailResult,
  RandomQuestionDraftItem,
  RandomQuestionPreviewResult,
} from '@/server/random-questions/types';

type RandomQuestionBoardClientProps = {
  locale: string;
};

type RequestState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type TopPanelKey = 'status' | 'details' | 'stats' | 'info';

const DEFAULT_TARGET_TOTAL = 5;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthTitle(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildMonthDays(currentMonth: Date): Date[] {
  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstDay.getUTCDay();
  const gridStart = new Date(Date.UTC(year, month, 1 - startWeekday));

  return Array.from({ length: 42 }, (_, index) => new Date(Date.UTC(
    gridStart.getUTCFullYear(),
    gridStart.getUTCMonth(),
    gridStart.getUTCDate() + index
  )));
}

function toDraftItems(items: RandomQuestionPreviewResult['items']): RandomQuestionDraftItem[] {
  return items.map((item) => ({
    questionId: item.questionId,
    questionUuid: item.questionUuid,
    asFirst: item.asFirst,
    category: item.category,
    sortOrder: item.sortOrder,
  }));
}

function QuestionIdentityTags({
  items,
  copiedField,
  onCopy,
}: {
  items: Array<{ questionId: string; questionUuid: string; category: string }>;
  copiedField: string | null;
  onCopy: (key: string, value: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={`identity-${item.questionId}`}
          className="grid gap-2 text-[11px] md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,1fr)] md:items-center"
        >
          <div className="min-w-0">
            <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <span className="truncate">{item.category}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void onCopy(`id-${item.questionId}`, item.questionId)}
            className="inline-flex min-w-0 items-center justify-between gap-2 rounded-full bg-slate-50 px-3 py-1 text-slate-600 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={`Copy question ID ${item.questionId}`}
            title={`Copy question ID ${item.questionId}`}
          >
            <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">ID</span>
            <span className="truncate font-mono text-slate-800 dark:text-slate-100">{item.questionId}</span>
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500">
              {copiedField === `id-${item.questionId}` ? <XIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onCopy(`uuid-${item.questionId}`, item.questionUuid)}
            className="inline-flex min-w-0 items-center justify-between gap-2 rounded-full bg-slate-50 px-3 py-1 text-[10px] text-slate-500 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={`Copy question UUID ${item.questionUuid}`}
            title={`Copy question UUID ${item.questionUuid}`}
          >
            <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">UUID</span>
            <span className="truncate font-mono">{item.questionUuid}</span>
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500">
              {copiedField === `uuid-${item.questionId}` ? <XIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function StatsPanel({
  stats,
}: {
  stats: {
    targetTotal: number;
    actualTotal: number;
    targetFirstCount: number;
    actualFirstCount: number;
    targetNormalCount: number;
    actualNormalCount: number;
  };
}) {
  const totalReady = stats.actualTotal === stats.targetTotal;
  const firstReady = stats.actualFirstCount === stats.targetFirstCount;
  const normalReady = stats.actualNormalCount === stats.targetNormalCount;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/30">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</div>
        <div className={`mt-2 text-2xl font-semibold ${totalReady ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
          {`${stats.actualTotal} / ${stats.targetTotal}`}
        </div>
      </div>
      <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/30">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">First question</div>
        <div className={`mt-2 text-2xl font-semibold ${firstReady ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
          {`${stats.actualFirstCount} / ${stats.targetFirstCount}`}
        </div>
      </div>
      <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/30">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Normal questions</div>
        <div className={`mt-2 text-2xl font-semibold ${normalReady ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
          {`${stats.actualNormalCount} / ${stats.targetNormalCount}`}
        </div>
      </div>
      <div className="hidden rounded-2xl bg-transparent p-4 sm:block" aria-hidden="true" />
    </div>
  );
}

function AnalysisPanel({
  analysis,
  loading,
}: {
  analysis: RandomQuestionAnalysisResult | null;
  loading: boolean;
}) {
  const metrics = [
    {
      label: 'GeneDays',
      value: analysis?.totalGeneratedDates ?? 0,
      valueClassName: 'text-emerald-600 dark:text-emerald-300',
      toneClassName: 'bg-emerald-50/90 dark:bg-emerald-500/10',
    },
    {
      label: 'ATF',
      value: analysis?.availableFirstQuestions ?? 0,
      valueClassName: 'text-sky-600 dark:text-sky-300',
      toneClassName: 'bg-sky-50/90 dark:bg-sky-500/10',
    },
    {
      label: 'New Days',
      value: analysis?.estimatedNewDays ?? 0,
      valueClassName: 'text-violet-600 dark:text-violet-300',
      toneClassName: 'bg-violet-50/90 dark:bg-violet-500/10',
    },
    {
      label: 'Question Total',
      value: analysis?.totalQuestions ?? 0,
      valueClassName: 'text-slate-700 dark:text-slate-100',
      toneClassName: 'bg-slate-50/90 dark:bg-white/5',
    },
    {
      label: 'Used Total',
      value: analysis?.usedQuestions ?? 0,
      valueClassName: 'text-amber-600 dark:text-amber-300',
      toneClassName: 'bg-amber-50/90 dark:bg-amber-500/10',
    },
    {
      label: 'Remain Total',
      value: analysis?.remainingQuestions ?? 0,
      valueClassName: 'text-cyan-600 dark:text-cyan-300',
      toneClassName: 'bg-cyan-50/90 dark:bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Analysis</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Generated coverage and remaining capacity
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn('rounded-2xl p-4 text-center', metric.toneClassName)}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {metric.label}
            </div>
            <div className={cn('mt-2 text-3xl font-bold tracking-tight sm:text-4xl', metric.valueClassName)}>
              {loading ? '--' : String(metric.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPanel({
  inventory,
  loading,
}: {
  inventory: RandomQuestionCategoryInventory[];
  loading: boolean;
}) {
  const displayInventory = inventory;
  const leftInventory = displayInventory.slice(0, 6);
  const rightInventory = displayInventory.slice(6, 12);

  return (
    <div>
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <InventoryTableSkeleton rows={12} className="md:hidden" />
          <InventoryTableSkeleton rows={6} className="hidden md:block" />
          <InventoryTableSkeleton rows={6} className="hidden md:block" />
        </div>
      ) : displayInventory.length > 0 ? (
        <div>
          <InventoryTable items={displayInventory} className="md:hidden" />
          <div className="hidden gap-3 md:grid md:grid-cols-2">
            <InventoryTable items={leftInventory} />
            {rightInventory.length > 0 ? <InventoryTable items={rightInventory} /> : null}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          No remaining inventory available.
        </div>
      )}
    </div>
  );
}

function InventoryTable({ items, className }: { items: RandomQuestionCategoryInventory[]; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-slate-50/80 dark:bg-white/5', className)}>
      <InventoryTableHeader />
      <div className="divide-y divide-black/5 dark:divide-white/10">
        {items.map((item) => (
          <InventoryTableRow key={item.category} item={item} />
        ))}
      </div>
    </div>
  );
}

function InventoryTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      <div>Category</div>
      <div className="text-center">Total</div>
      <div className="text-center">First</div>
      <div className="text-center">Normal</div>
    </div>
  );
}

function InventoryTableRow({ item }: { item: RandomQuestionCategoryInventory }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] items-center gap-2 px-3 py-2.5"
      title={`${item.category}: total ${item.totalCount}, first ${item.firstCount}, normal ${item.normalCount}`}
    >
      <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">{item.category}</div>
      <InventoryValue value={item.totalCount} />
      <InventoryValue value={item.firstCount} tone="first" />
      <InventoryValue value={item.normalCount} tone="normal" />
    </div>
  );
}

function InventoryValue({ value, tone = 'total' }: { value: number; tone?: 'first' | 'normal' | 'total' }) {
  return (
    <div
      className={cn(
        'text-center text-sm font-semibold',
        tone === 'total' && 'text-slate-900 dark:text-white',
        tone === 'first' && 'text-amber-700 dark:text-amber-200',
        tone === 'normal' && 'text-sky-700 dark:text-sky-200'
      )}
    >
      {value}
    </div>
  );
}

function InventoryTableSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-slate-50/80 dark:bg-white/5', className)}>
      <InventoryTableHeader />
      <div className="divide-y divide-black/5 dark:divide-white/10">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] items-center gap-2 px-3 py-2.5"
          >
            <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-7 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-7 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-7 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RandomQuestionBoardClient({ locale }: RandomQuestionBoardClientProps) {
  const today = useMemo(() => getTodayString(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => parseDateString(`${today.slice(0, 7)}-01`));
  const [analysisState, setAnalysisState] = useState<RequestState<RandomQuestionAnalysisResult>>({
    data: null,
    loading: true,
    error: null,
  });
  const [detailState, setDetailState] = useState<RequestState<RandomQuestionDetailResult>>({
    data: null,
    loading: false,
    error: null,
  });
  const [previewState, setPreviewState] = useState<RequestState<RandomQuestionPreviewResult>>({
    data: null,
    loading: false,
    error: null,
  });
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [savedIndex, setSavedIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTopPanel, setActiveTopPanel] = useState<TopPanelKey>('status');
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);
  const generatedDateSet = useMemo(
    () => new Set(analysisState.data?.dates.map((item) => item.showDate) ?? []),
    [analysisState.data]
  );
  const monthDays = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth]);
  const selectedHasSavedSet = generatedDateSet.has(selectedDate);
  const guidanceResetKey = previewState.data?.messages.join('|') ?? '';

  async function loadAnalysis() {
    setAnalysisState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch('/api/random-questions/analysis', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RandomQuestionAnalysisResult;
      setAnalysisState({ data, loading: false, error: null });
    } catch (error) {
      setAnalysisState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function loadDetail(showDate: string) {
    setDetailState({ data: null, loading: true, error: null });

    try {
      const response = await fetch(`/api/random-questions?showDate=${showDate}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RandomQuestionDetailResult | null;
      setDetailState({ data, loading: false, error: null });
    } catch (error) {
      setDetailState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  useEffect(() => {
    void loadAnalysis();
  }, []);

  useEffect(() => {
    setPreviewState({ data: null, loading: false, error: null });
    setPreviewIndex(0);
    setSavedIndex(0);
    setActiveTopPanel('status');
    setReplaceConfirmOpen(false);
    setGuidanceDismissed(false);
    void loadDetail(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setPreviewIndex(0);
  }, [previewState.data?.showDate, previewState.data?.items.length]);

  useEffect(() => {
    setGuidanceDismissed(false);
  }, [previewState.data?.showDate, guidanceResetKey]);

  useEffect(() => {
    setSavedIndex(0);
  }, [detailState.data?.showDate, detailState.data?.items.length]);

  async function handlePreview() {
    setPreviewState({ data: null, loading: true, error: null });

    try {
      const response = await fetch('/api/random-questions/preview', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showDate: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RandomQuestionPreviewResult;
      setPreviewState({ data, loading: false, error: null });
    } catch (error) {
      setPreviewState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleSavePreview(replaceExisting: boolean) {
    if (!previewState.data?.canCommit || saving) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/random-questions/commit', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showDate: selectedDate,
          replaceExisting,
          items: toDraftItems(previewState.data.items),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      await loadAnalysis();
      await loadDetail(selectedDate);
      setPreviewState({ data: null, loading: false, error: null });
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setSaving(false);
    }
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);

    if (copyResetTimerRef.current) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopiedField(null);
      copyResetTimerRef.current = null;
    }, 1400);
  }

  function cancelPreview() {
    setPreviewState({ data: null, loading: false, error: null });
    setPreviewIndex(0);
  }

  const activeStats = previewState.data?.stats ?? detailState.data?.stats ?? null;
  const displayStats = activeStats ?? {
    targetTotal: DEFAULT_TARGET_TOTAL,
    actualTotal: 0,
    targetFirstCount: 1,
    actualFirstCount: 0,
    targetNormalCount: DEFAULT_TARGET_TOTAL - 1,
    actualNormalCount: 0,
  };
  const activeMessages = previewState.data?.messages ?? [];
  const previewItems = previewState.data?.items ?? [];
  const hasPreviewNavigation = previewItems.length > 1;
  const safePreviewIndex = previewItems.length > 0 ? Math.min(previewIndex, previewItems.length - 1) : 0;
  const activePreviewItem = previewItems[safePreviewIndex] ?? null;
  const savedItems = detailState.data?.items ?? [];
  const hasSavedNavigation = savedItems.length > 1;
  const safeSavedIndex = savedItems.length > 0 ? Math.min(savedIndex, savedItems.length - 1) : 0;
  const activeSavedItem = savedItems[safeSavedIndex] ?? null;
  const selectedStatusBadge = previewState.data
    ? {
        label: 'Preview',
        className:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200',
      }
    : selectedHasSavedSet
      ? {
          label: 'Saved',
          className:
            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200',
        }
      : {
          label: 'No sets',
          className:
            'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200',
        };
  const panelItems = [
    { key: 'status' as const, label: 'Status' },
    { key: 'details' as const, label: 'Details' },
    { key: 'stats' as const, label: 'Analysis' },
    { key: 'info' as const, label: 'Info' },
  ];

  return (
    <div className="min-h-[calc(100vh-18rem)] space-y-6">
      <div className="grid gap-6 xl:items-stretch xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="rounded-3xl border border-black/10 p-4 dark:border-white/10 xl:self-stretch">
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() - 1, 1))
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                aria-label="Previous month"
                title="Previous month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{getMonthTitle(calendarMonth)}</div>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() + 1, 1))
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                aria-label="Next month"
                title="Next month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dayString = formatDateString(day);
                const isCurrentMonth = day.getUTCMonth() === calendarMonth.getUTCMonth();
                const isSelected = dayString === selectedDate;
                const isGenerated = generatedDateSet.has(dayString);

                return (
                  <button
                    key={dayString}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dayString);
                      setCalendarMonth(new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1)));
                    }}
                    className={cn(
                      'relative flex h-11 items-center justify-center rounded-2xl border text-sm transition',
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/5',
                      isGenerated
                        ? 'border-emerald-300 dark:border-emerald-400'
                        : isSelected
                          ? 'border-black/20 dark:border-white/20'
                          : 'border-black/10 dark:border-white/10',
                      isCurrentMonth ? '' : 'opacity-45'
                    )}
                    title={isGenerated ? `${dayString} has a saved set` : `Open ${dayString}`}
                  >
                    <span>{day.getUTCDate()}</span>
                    {isGenerated ? (
                      <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10 xl:self-stretch">
          <div className="flex flex-col gap-4 xl:h-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{selectedDate}</div>
                <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold', selectedStatusBadge.className)}>
                  {selectedStatusBadge.label}
                </div>
              </div>
              <XToggleButton
                ariaLabel="Top panel toggle"
                value={activeTopPanel}
                onChange={(value) => setActiveTopPanel(value as TopPanelKey)}
                options={panelItems.map((item) => ({
                  value: item.key,
                  label: item.label,
                }))}
                size="compact"
                className="max-w-full border-black/10 dark:border-white/10"
                minItemWidthClassName="min-w-[64px] sm:min-w-[88px]"
                itemPaddingClassName="px-4 py-2"
                itemTextClassName="text-sm"
                inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
              />
            </div>

            <div className="min-h-[22rem] flex-1 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              {activeTopPanel === 'status' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Current status</div>
                    <div className="flex flex-wrap gap-2">
                      {previewState.data ? (
                        <>
                          {previewState.data.canCommit ? (
                            <GradientButton
                              onClick={async () => {
                                if (selectedHasSavedSet) {
                                  setReplaceConfirmOpen(true);
                                  return;
                                }

                                await handleSavePreview(false);
                              }}
                              title="Save set"
                              loadingText="Saving..."
                              align="center"
                              icon=<BookCheckIcon/>
                              className="sm:w-auto"
                              disabled={saving}
                            />
                          ) : null}
                          <XButton
                            type="single"
                            variant="subtle"
                            minWidth="min-w-0"
                            className="px-4 py-2"
                            button={{
                              icon: false,
                              text: 'Cancel',
                              onClick: cancelPreview,
                            }}
                          />
                        </>
                      ) : (
                        <GradientButton
                          onClick={() => void handlePreview()}
                          title="Generate preview"
                          loadingText="Loading..."
                          align="center"
                          icon=<CircleStopIcon/>
                          className="sm:w-auto"
                          disabled={previewState.loading || detailState.loading}
                        />
                      )}
                    </div>
                  </div>

                  <StatsPanel stats={displayStats} />

                </div>
              ) : null}

              {activeTopPanel === 'details' ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Supporting details</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Categories and IDs for this set
                    </div>
                  </div>
                  {(previewItems.length > 0 || savedItems.length > 0) ? (
                    <QuestionIdentityTags
                      items={
                        (previewItems.length > 0 ? previewItems : savedItems).map((item) => ({
                          questionId: item.questionId,
                          questionUuid: item.questionUuid,
                          category: item.category,
                        }))
                      }
                      copiedField={copiedField}
                      onCopy={copyText}
                    />
                  ) : (
                    <div className="rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                      No detail items available for the selected date.
                    </div>
                  )}
                </div>
              ) : null}

              {activeTopPanel === 'stats' ? (
                <AnalysisPanel analysis={analysisState.data} loading={analysisState.loading} />
              ) : null}

              {activeTopPanel === 'info' ? (
                <InfoPanel
                  inventory={analysisState.data?.categoryInventory ?? []}
                  loading={analysisState.loading}
                />
              ) : null}
            </div>

            {analysisState.error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {`Failed to load analysis data: ${analysisState.error}`}
              </div>
            ) : null}
            {detailState.error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {`Failed to load saved set: ${detailState.error}`}
              </div>
            ) : null}
            {previewState.error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {`Request failed: ${previewState.error}`}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeMessages.length > 0 && !guidanceDismissed ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Guidance</div>
                <div className="mt-2 space-y-1">
                  {activeMessages.map((message) => (
                    <div key={message}>{message}</div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidanceDismissed(true)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:text-amber-200 dark:hover:bg-amber-400/10 dark:hover:text-amber-100"
                aria-label="Close guidance"
                title="Close guidance"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {activePreviewItem?.question ? (
          <div className="space-y-4">
            <QuestionDetail
              key={`preview-${activePreviewItem.questionId}`}
              locale={locale}
              question={activePreviewItem.question}
              answerOptions={buildReadonlyAnswerOptions(
                activePreviewItem.question.correctAnswer,
                activePreviewItem.question.incorrectAnswers,
                activePreviewItem.question.correctAnswerIndex,
                activePreviewItem.question.id
              )}
            />
            <div className="rounded-[1.75rem] border border-black/10 bg-neutral-100 p-3 dark:border-white/10 dark:bg-neutral-900">
              <div className="flex min-w-0 items-center justify-center">
                <div className="flex min-w-0 items-center gap-2">
                  {hasPreviewNavigation ? (
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((current) => Math.max(0, current - 1))}
                      disabled={safePreviewIndex <= 0}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Previous"
                      title="Previous"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div
                    className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 p-1 dark:border-white/10 dark:bg-white/5"
                    aria-label={hasPreviewNavigation ? `Progress ${safePreviewIndex + 1}/${previewItems.length}` : 'Preview'}
                    title={hasPreviewNavigation ? `Progress ${safePreviewIndex + 1}/${previewItems.length}` : 'Preview'}
                  >
                    <div className="min-w-0 px-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span className="truncate">
                        {hasPreviewNavigation ? `${safePreviewIndex + 1}/${previewItems.length}` : 'Preview'}
                      </span>
                    </div>
                  </div>
                  {hasPreviewNavigation ? (
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((current) => Math.min(previewItems.length - 1, current + 1))}
                      disabled={safePreviewIndex >= previewItems.length - 1}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Next"
                      title="Next"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : activeSavedItem?.question ? (
          <div className="space-y-4">
            <QuestionDetail
              key={`saved-${activeSavedItem.id}`}
              locale={locale}
              question={activeSavedItem.question}
              answerOptions={buildReadonlyAnswerOptions(
                activeSavedItem.question.correctAnswer,
                activeSavedItem.question.incorrectAnswers,
                activeSavedItem.question.correctAnswerIndex,
                activeSavedItem.question.id
              )}
            />
            <div className="rounded-[1.75rem] border border-black/10 bg-neutral-100 p-3 dark:border-white/10 dark:bg-neutral-900">
              <div className="flex min-w-0 items-center justify-center">
                <div className="flex min-w-0 items-center gap-2">
                  {hasSavedNavigation ? (
                    <button
                      type="button"
                      onClick={() => setSavedIndex((current) => Math.max(0, current - 1))}
                      disabled={safeSavedIndex <= 0}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Previous"
                      title="Previous"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div
                    className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 p-1 dark:border-white/10 dark:bg-white/5"
                    aria-label={hasSavedNavigation ? `Progress ${safeSavedIndex + 1}/${savedItems.length}` : 'Saved set'}
                    title={hasSavedNavigation ? `Progress ${safeSavedIndex + 1}/${savedItems.length}` : 'Saved set'}
                  >
                    <div className="min-w-0 px-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span className="truncate">
                        {hasSavedNavigation ? `${safeSavedIndex + 1}/${savedItems.length}` : 'Saved set'}
                      </span>
                    </div>
                  </div>
                  {hasSavedNavigation ? (
                    <button
                      type="button"
                      onClick={() => setSavedIndex((current) => Math.min(savedItems.length - 1, current + 1))}
                      disabled={safeSavedIndex >= savedItems.length - 1}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Next"
                      title="Next"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {detailState.loading ? 'Loading...' : 'No questions to display for this date yet.'}
          </div>
        )}
      </div>

      {replaceConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onClick={() => setReplaceConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Replace saved set?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {`A saved set already exists for ${selectedDate}. Saving will replace it with the current preview.`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action removes the old saved set for the selected date before writing the new one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplaceConfirmOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label="Close replace confirmation"
                title="Close replace confirmation"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2"
                button={{
                  icon: false,
                  text: 'Cancel',
                  onClick: () => setReplaceConfirmOpen(false),
                }}
              />
              <GradientButton
                onClick={async () => {
                  setReplaceConfirmOpen(false);
                  await handleSavePreview(true);
                }}
                title="Replace and save"
                loadingText="Saving..."
                align="center"
                className="sm:w-auto"
                disabled={saving}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
