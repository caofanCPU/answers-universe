'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookCheckIcon,
  ChartColumnStackedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleStopIcon,
  CopyIcon,
  InfoIcon,
  ListTodoIcon,
  RefreshCcwIcon,
  Trash2Icon,
  XIcon,
} from '@windrun-huaiin/base-ui/icons';
import { cn, getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { ConfirmDialog, InfoDialog } from '@windrun-huaiin/third-ui/main/alert-dialog';
import { GradientButton, XButton, XToggleButton } from '@windrun-huaiin/third-ui/main/buttons';
import { buildReadonlyAnswerOptions } from './question-answer-options';
import { QuestionDetail } from './question-detail';
import { RandomQuestionCalendarPanel } from './random-question-calendar-panel';
import {
  isSnapshotVersionMismatchResponse,
  toRandomQuestionDraftItems,
  type PlannedDay,
  type RequestState,
} from './random-question-board-types';
import type {
  RandomQuestionAnalysisResult,
  RandomQuestionCategoryInventory,
  RandomQuestionDetailResult,
  RandomQuestionPreviewResult,
} from '@/server/random-questions/types';

type RandomQuestionBoardClientProps = {
  locale: string;
};

type TopPanelKey = 'details' | 'stats' | 'info';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function QuestionIdentityTags({
  items,
  copiedField,
  onCopy,
}: {
  items: Array<{ questionId: string; questionUuid: string; category: string; asFirst: number }>;
  copiedField: string | null;
  onCopy: (key: string, value: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={`identity-${item.questionId}`}
          className="grid gap-2 text-[11px] md:grid-cols-[24fr_3fr_18fr_55fr] md:items-center"
        >
          <div className="min-w-0">
            <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <span className="truncate">{item.category}</span>
            </span>
          </div>
          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex w-full min-w-0 justify-center rounded-full px-2 py-1 text-[10px] font-semibold',
                item.asFirst > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
              )}
              title={item.asFirst > 0 ? 'First question' : 'Normal question'}
            >
              {item.asFirst > 0 ? 'First' : '-'}
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

function AnalysisPanel({
  analysis,
  loading,
  onRefresh,
}: {
  analysis: RandomQuestionAnalysisResult | null;
  loading: boolean;
  onRefresh: () => void;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Generated coverage and remaining capacity
        </div>
        <GradientButton
          onClick={onRefresh}
          title="Refresh"
          loadingText="Refreshing..."
          align="center"
          variant="soft"
          className="h-9 min-h-0 px-4 py-0 text-sm sm:w-auto"
          disabled={loading}
          icon={<RefreshCcwIcon className="h-3.5 w-3.5"/>}
        />
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
  const [plannedDays, setPlannedDays] = useState<PlannedDay[]>([]);
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
  const [activeTopPanel, setActiveTopPanel] = useState<TopPanelKey>('details');
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [clearSavedConfirmOpen, setClearSavedConfirmOpen] = useState(false);
  const [clearSavedPlanGuardOpen, setClearSavedPlanGuardOpen] = useState(false);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const [planActionsOpen, setPlanActionsOpen] = useState(false);
  const [activeSnapshotVersion, setActiveSnapshotVersion] = useState<string | null>(null);
  const [plannedDataOutdated, setPlannedDataOutdated] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);
  const generatedDateSet = useMemo(
    () => new Set(analysisState.data?.dates.map((item) => item.showDate) ?? []),
    [analysisState.data]
  );
  const plannedDayMap = useMemo(() => new Map(plannedDays.map((item) => [item.showDate, item])), [plannedDays]);
  const selectedHasSavedSet = generatedDateSet.has(selectedDate);
  const selectedPlannedDay = plannedDayMap.get(selectedDate) ?? null;
  const guidanceResetKey = previewState.data?.messages.join('|') ?? '';

  async function loadAnalysis(options?: { forceRefresh?: boolean }) {
    setAnalysisState((current) => ({ ...current, loading: true, error: null }));

    try {
      const query = options?.forceRefresh ? '?refresh=true' : '';
      const response = await fetch(`/api/random-questions/analysis${query}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RandomQuestionAnalysisResult;
      setAnalysisState({ data, loading: false, error: null });
      setActiveSnapshotVersion(data.snapshotVersion);
      setPlannedDataOutdated(false);

      if (options?.forceRefresh) {
        setPlannedDays([]);
        setPreviewState({ data: null, loading: false, error: null });
      }
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
    setPreviewState({ data: selectedPlannedDay?.preview ?? null, loading: false, error: null });
    setPreviewIndex(0);
    setSavedIndex(0);
    setActiveTopPanel('details');
    setReplaceConfirmOpen(false);
    setClearSavedConfirmOpen(false);
    setGuidanceDismissed(false);
    if (selectedHasSavedSet) {
      void loadDetail(selectedDate);
      return;
    }

    setDetailState({ data: null, loading: false, error: null });
  }, [selectedDate, selectedHasSavedSet, selectedPlannedDay?.groupId, selectedPlannedDay?.preview]);

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
    const response = await fetch('/api/random-questions/preview', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snapshotVersion: activeSnapshotVersion,
        showDate: selectedDate,
      }),
    });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        if (response.status === 409 && isSnapshotVersionMismatchResponse(errorBody)) {
          setPlannedDataOutdated(true);
          setPreviewState((current) => ({
            ...current,
            loading: false,
            error: 'Planned data is outdated. Refresh required.',
          }));
          return;
        }
        setPreviewState({
          data: null,
          loading: false,
        error: `Request failed with status ${response.status}`,
      });
      return;
    }

    const preview = (await response.json()) as RandomQuestionPreviewResult;
    setActiveSnapshotVersion(preview.snapshotVersion ?? null);
    setPreviewState({
      data: preview,
      loading: false,
      error: null,
    });
    setPlannedDays((current) => [
      ...current.filter((item) => item.showDate !== selectedDate),
      {
        showDate: selectedDate,
        groupId: preview.groupId ?? toRandomQuestionDraftItems(preview.items).map((item) => item.questionId).sort((a, b) => Number(a) - Number(b)).join(','),
        preview,
      },
    ]);
  }

  async function handleGenerateRequest() {
    if (plannedDays.length > 0 && !selectedPlannedDay) {
      setGenerateConfirmOpen(true);
      return;
    }

    await handlePreview();
  }

  async function handleSavePreview(replaceExisting: boolean) {
    if (!previewState.data?.canCommit || saving) {
      return;
    }

    const snapshotVersion = previewState.data.snapshotVersion || activeSnapshotVersion;
    if (!snapshotVersion) {
      setPreviewState((current) => ({
        ...current,
        error: 'Snapshot version is missing. Refresh analysis before saving.',
      }));
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
          snapshotVersion,
          groupId: previewState.data.groupId,
          showDate: selectedDate,
          replaceExisting,
          items: toRandomQuestionDraftItems(previewState.data.items),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        if (response.status === 409 && isSnapshotVersionMismatchResponse(errorBody)) {
          setPlannedDataOutdated(true);
          throw new Error('Planned data is outdated. Refresh required.');
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      await loadAnalysis();
      await loadDetail(selectedDate);
      setPlanActionsOpen(false);
      setPreviewState({ data: null, loading: false, error: null });
      setPlannedDays((current) => current.filter((item) => item.showDate !== selectedDate));
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAllPlanned() {
    const commitReadyPlans = plannedDays.filter((item) => item.preview.canCommit && !generatedDateSet.has(item.showDate));

    if (commitReadyPlans.length === 0 || saving) {
      return;
    }

    const plansToCommit = commitReadyPlans.map((item) => {
      const snapshotVersion = item.preview.snapshotVersion || activeSnapshotVersion;
      return {
        snapshotVersion,
        groupId: item.groupId,
        showDate: item.showDate,
        items: toRandomQuestionDraftItems(item.preview.items),
      };
    });

    if (plansToCommit.some((item) => !item.snapshotVersion)) {
      setPreviewState((current) => ({
        ...current,
        error: 'Snapshot version is missing. Refresh analysis before saving.',
      }));
      return;
    }
    const validPlansToCommit = plansToCommit.map((item) => ({
      ...item,
      snapshotVersion: item.snapshotVersion as string,
    }));

    setSaving(true);

    try {
      const response = await fetch('/api/random-questions/commit-bulk', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plans: validPlansToCommit,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        if (response.status === 409 && isSnapshotVersionMismatchResponse(errorBody)) {
          setPlannedDataOutdated(true);
          throw new Error('Planned data is outdated. Refresh required.');
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      await loadAnalysis();
      await loadDetail(selectedDate);
      setPlannedDays([]);
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

  async function handleClearSavedSet() {
    setSaving(true);

    try {
      const response = await fetch(`/api/random-questions?showDate=${selectedDate}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      await loadAnalysis();
      await loadDetail(selectedDate);
      setPreviewState({ data: null, loading: false, error: null });
    } catch (error) {
      setDetailState((current) => ({
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
    setPlannedDays((current) => current.filter((item) => item.showDate !== selectedDate));
  }

  const commitReadyPlans = useMemo(
    () => plannedDays.filter((item) => item.preview.canCommit && !generatedDateSet.has(item.showDate)),
    [generatedDateSet, plannedDays]
  );

  const activeMessages = previewState.data?.messages ?? [];
  const previewItems = previewState.data?.items ?? [];
  const hasPreviewNavigation = previewItems.length > 1;
  const safePreviewIndex = previewItems.length > 0 ? Math.min(previewIndex, previewItems.length - 1) : 0;
  const activePreviewItem = previewItems[safePreviewIndex] ?? null;
  const activePreviewEditHref = activePreviewItem
    ? getAsNeededLocalizedUrl(locale, `/questions/${activePreviewItem.questionId}/edit`)
    : null;
  const savedItems = detailState.data?.items ?? [];
  const hasSavedNavigation = savedItems.length > 1;
  const safeSavedIndex = savedItems.length > 0 ? Math.min(savedIndex, savedItems.length - 1) : 0;
  const activeSavedItem = savedItems[safeSavedIndex] ?? null;
  const activeSavedEditHref = activeSavedItem
    ? getAsNeededLocalizedUrl(locale, `/questions/${activeSavedItem.questionId}/edit`)
    : null;
  const selectedStatusBadge = previewState.data
    ? {
        label: selectedPlannedDay ? 'Planned' : 'Preview',
        className:
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200',
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
    { key: 'details' as const, label: 'Details', mobileIcon: <ListTodoIcon className="h-4 w-4" /> },
    { key: 'stats' as const, label: 'Analysis', mobileIcon: <ChartColumnStackedIcon className="h-4 w-4" /> },
    { key: 'info' as const, label: 'Info', mobileIcon: <InfoIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-[calc(100vh-18rem)] min-w-0 space-y-6">
      <div className="grid min-w-0 gap-6 xl:items-stretch xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="flex min-w-0 max-w-full flex-col space-y-3 overflow-hidden xl:h-full">
          <RandomQuestionCalendarPanel
            selectedDate={selectedDate}
            savedDates={generatedDateSet}
            plannedDays={plannedDays}
            activeSnapshotVersion={activeSnapshotVersion}
            onSelectedDateChange={setSelectedDate}
            onPlannedDaysChange={setPlannedDays}
            onPreviewStateChange={setPreviewState}
            onSnapshotVersionChange={setActiveSnapshotVersion}
            onPlannedDataOutdatedChange={setPlannedDataOutdated}
            onOpenPlanActions={() => setPlanActionsOpen(true)}
            onShowDetailsPanel={() => setActiveTopPanel('details')}
          />
        </div>

        <div className="min-w-0 overflow-hidden rounded-3xl border border-black/10 p-4 dark:border-white/10 sm:p-5 xl:self-stretch">
          <div className="flex min-w-0 flex-col gap-4 xl:h-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <XToggleButton
                ariaLabel="Top panel toggle"
                value={activeTopPanel}
                onChange={(value) => setActiveTopPanel(value as TopPanelKey)}
                options={panelItems.map((item) => ({
                  value: item.key,
                  label: item.label,
                }))}
                size="compact"
                className="mx-auto max-w-full border-black/10 dark:border-white/10"
                minItemWidthClassName="min-w-[88px]"
                maxItemWidthClassName="max-w-[160px]"
                itemPaddingClassName="px-4 py-2"
                itemTextClassName="text-sm"
                inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
              />
            </div>

            <div className={cn(
              'min-w-0 overflow-hidden p-3 sm:p-4',
              activeTopPanel === 'info' ? '' : 'rounded-2xl border border-black/10 dark:border-white/10'
            )}>
              {activeTopPanel === 'details' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{selectedDate}</div>
                      <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold', selectedStatusBadge.className)}>
                        {selectedStatusBadge.label}
                      </div>
                    </div>
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
                              variant="soft"
                              icon={<BookCheckIcon/>}
                              className="h-9 min-h-0 px-4 py-0 text-sm sm:w-auto"
                              disabled={saving || plannedDataOutdated}
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
                      ) : selectedHasSavedSet ? (
                        <>
                          <GradientButton
                            onClick={() => void handleGenerateRequest()}
                            title="Regenerate"
                            loadingText="Loading..."
                            align="center"
                            variant="soft"
                            icon={<CircleStopIcon/>}
                            className="h-9 min-h-0 px-4 py-0 text-sm sm:w-auto"
                            disabled={previewState.loading || detailState.loading || plannedDataOutdated || saving}
                          />
                          <XButton
                            type="single"
                            variant="subtle"
                            minWidth="min-w-0"
                            className="h-9 min-h-0 px-4 py-0 text-sm text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-400/20 dark:hover:bg-red-500/10"
                            loadingText="Deleting..."
                            
                            button={{
                              icon: <Trash2Icon className="text-red-700"/>,
                              text: 'Delete',
                              onClick: () => {
                                if (plannedDays.length > 0) {
                                  setClearSavedPlanGuardOpen(true);
                                  return;
                                }

                                setClearSavedConfirmOpen(true);
                              },
                              disabled: saving || detailState.loading,
                            }}
                          />
                        </>
                      ) : (
                        <GradientButton
                          onClick={() => void handleGenerateRequest()}
                          title="Generate"
                          loadingText="Loading..."
                          align="center"
                          variant="soft"
                          icon={<CircleStopIcon/>}
                          className="h-9 min-h-0 px-4 py-0 text-sm sm:w-auto"
                          disabled={previewState.loading || detailState.loading || plannedDataOutdated}
                        />
                      )}
                    </div>
                  </div>
                  {(previewItems.length > 0 || savedItems.length > 0) ? (
                    <QuestionIdentityTags
                      items={
                        (previewItems.length > 0 ? previewItems : savedItems).map((item) => ({
                          questionId: item.questionId,
                          questionUuid: item.questionUuid,
                          asFirst: item.asFirst,
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
                <AnalysisPanel
                  analysis={analysisState.data}
                  loading={analysisState.loading}
                  onRefresh={() => {
                    void loadAnalysis({ forceRefresh: true });
                  }}
                />
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
            {plannedDataOutdated ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Request failed: Planned data is outdated. Refresh required.</span>
                  <GradientButton
                    onClick={() => {
                      void loadAnalysis({ forceRefresh: true });
                    }}
                    title="Refresh"
                    align="center"
                    variant="soft"
                    className="h-8 min-h-0 px-3 py-0 text-xs sm:w-auto"
                    icon={<RefreshCcwIcon className="h-3.5 w-3.5"/>}
                  />
                </div>
              </div>
            ) : previewState.error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{`Request failed: ${previewState.error}`}</span>
                </div>
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
              editAction={{
                enabled: Boolean(activePreviewEditHref),
                onClick: () => {
                  if (activePreviewEditHref) {
                    window.location.href = activePreviewEditHref;
                  }
                },
                label: 'Edit',
              }}
            />
            <div className="rounded-[1.75rem] bg-neutral-100 p-3 dark:bg-neutral-900">
              <div className="flex min-w-0 items-center justify-center gap-2">
                  {hasPreviewNavigation ? (
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((current) => Math.max(0, current - 1))}
                      disabled={safePreviewIndex <= 0}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Previous"
                      title="Previous"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div
                    className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
                    aria-label={hasPreviewNavigation ? `Progress ${safePreviewIndex + 1}/${previewItems.length}` : 'Preview'}
                    title={hasPreviewNavigation ? `Progress ${safePreviewIndex + 1}/${previewItems.length}` : 'Preview'}
                  >
                    <div className="min-w-0 px-4 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
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
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Next"
                      title="Next"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  ) : null}
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
              editAction={{
                enabled: Boolean(activeSavedEditHref),
                onClick: () => {
                  if (activeSavedEditHref) {
                    window.location.href = activeSavedEditHref;
                  }
                },
                label: 'Edit',
              }}
            />
            <div className="rounded-[1.75rem] bg-neutral-100 p-3 dark:bg-neutral-900">
              <div className="flex min-w-0 items-center justify-center gap-2">
                  {hasSavedNavigation ? (
                    <button
                      type="button"
                      onClick={() => setSavedIndex((current) => Math.max(0, current - 1))}
                      disabled={safeSavedIndex <= 0}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Previous"
                      title="Previous"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div
                    className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
                    aria-label={hasSavedNavigation ? `Progress ${safeSavedIndex + 1}/${savedItems.length}` : 'Saved set'}
                    title={hasSavedNavigation ? `Progress ${safeSavedIndex + 1}/${savedItems.length}` : 'Saved set'}
                  >
                    <div className="min-w-0 px-4 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
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
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                      aria-label="Next"
                      title="Next"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-112 items-center justify-center rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {detailState.loading ? 'Loading...' : 'No questions to display for this date yet.'}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={replaceConfirmOpen}
        onOpenChange={setReplaceConfirmOpen}
        type="danger"
        title="Replace saved set?"
        description={
          <>
            <span className="block">
              {`A saved set already exists for ${selectedDate}. Saving will replace it with the current preview.`}
            </span>
          </>
        }
        cancelText="Cancel"
        confirmText="Replace and save"
        loadingActions={['confirm']}
        onConfirm={async () => {
          await handleSavePreview(true);
        }}
      />

      <ConfirmDialog
        open={clearSavedConfirmOpen}
        onOpenChange={setClearSavedConfirmOpen}
        type="danger"
        title="Delete saved set?"
        description={`This will permanently delete the saved random question set for ${selectedDate}.`}
        cancelText="Cancel"
        confirmText="Delete"
        loadingActions={['confirm']}
        onConfirm={async () => {
          await handleClearSavedSet();
        }}
      />

      <InfoDialog
        open={clearSavedPlanGuardOpen}
        onOpenChange={setClearSavedPlanGuardOpen}
        type="warn"
        title="Plan data pending"
        description="Temporary planned data already exists. Process the current planned days before clearing a saved set."
        confirmText="Go to plan"
        onConfirm={() => {
          const firstPlannedDate = plannedDays[0]?.showDate;
          setClearSavedPlanGuardOpen(false);
          if (firstPlannedDate) {
            setSelectedDate(firstPlannedDate);
            setActiveTopPanel('details');
          }
        }}
      />

      <InfoDialog
        open={generateConfirmOpen}
        onOpenChange={setGenerateConfirmOpen}
        type="warn"
        title="Plan data pending"
        description="Temporary planned data already exists. Process the current planned days first before generating a new group."
        confirmText="Go to plan"
        onConfirm={() => {
          const firstPlannedDate = plannedDays[0]?.showDate;
          setGenerateConfirmOpen(false);
          if (firstPlannedDate) {
            setSelectedDate(firstPlannedDate);
            setActiveTopPanel('details');
          }
        }}
      />

      <ConfirmDialog
        open={planActionsOpen}
        onOpenChange={setPlanActionsOpen}
        type="danger"
        emphasis="cancel"
        title={`${plannedDays.length} planned day${plannedDays.length === 1 ? '' : 's'}`}
        description={
          plannedDataOutdated
            ? 'Planned data is outdated. Refresh analysis before saving or clear the current temporary plans.'
            : commitReadyPlans.length > 0
            ? `${commitReadyPlans.length} planned day${commitReadyPlans.length === 1 ? '' : 's'} can be saved now. Clear plans to drop all temporary plan data, or save all commit-ready plans together.`
            : 'No commit-ready planned days are available right now. You can still clear all temporary plan data.'
        }
        cancelText="Clear plans"
        confirmText="Save all"
        loadingActions={['confirm']}
        onCancel={() => {
          setPlannedDays([]);
          setPreviewState({ data: null, loading: false, error: null });
        }}
        onConfirm={async () => {
          if (!plannedDataOutdated && commitReadyPlans.length > 0) {
            await handleSaveAllPlanned();
          }
        }}
      />
    </div>
  );
}
