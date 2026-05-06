'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarClockIcon, CalendarDaysIcon } from '@windrun-huaiin/base-ui/icons';
import { CalendarStatusView, RandomDateRangeDialog, type RandomCalendarRange, type CalendarDayState } from '@windrun-huaiin/third-ui/main/calendar';
import {
  isSnapshotVersionMismatchResponse,
  type PlannedDay,
  type RequestState,
} from './random-question-board-types';
import type {
  RandomQuestionPlanRangeResult,
  RandomQuestionPreviewResult,
} from '@/server/random-questions/types';

type RandomQuestionCalendarDayKey = 'saved' | 'planned';

type RandomQuestionCalendarPanelProps = {
  selectedDate: string;
  savedDates: Set<string>;
  plannedDays: PlannedDay[];
  activeSnapshotVersion: string | null;
  onSelectedDateChange: (date: string) => void;
  onPlannedDaysChange: (updater: PlannedDay[] | ((current: PlannedDay[]) => PlannedDay[])) => void;
  onPreviewStateChange: (state: RequestState<RandomQuestionPreviewResult>) => void;
  onSnapshotVersionChange: (version: string | null) => void;
  onPlannedDataOutdatedChange: (outdated: boolean) => void;
  onOpenPlanActions: () => void;
  onShowDetailsPanel: () => void;
};

function createEmptyRange(): RandomCalendarRange {
  return { startDate: null, endDate: null };
}

function toPlannedDay(item: RandomQuestionPlanRangeResult['plannedDates'][number], snapshotVersion: string): PlannedDay {
  return {
    showDate: item.showDate,
    groupId: item.groupId,
    preview: {
      snapshotVersion,
      groupId: item.groupId,
      showDate: item.showDate,
      targetCount: item.targetCount,
      canCommit: item.canCommit,
      reasons: item.reasons,
      messages: item.messages,
      stats: item.stats,
      items: item.items,
    },
  };
}

export function RandomQuestionCalendarPanel({
  selectedDate,
  savedDates,
  plannedDays,
  activeSnapshotVersion,
  onSelectedDateChange,
  onPlannedDaysChange,
  onPreviewStateChange,
  onSnapshotVersionChange,
  onPlannedDataOutdatedChange,
  onOpenPlanActions,
  onShowDetailsPanel,
}: RandomQuestionCalendarPanelProps) {
  const [rangeSelection, setRangeSelection] = useState<RandomCalendarRange>(createEmptyRange);
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const dayStates = useMemo(() => {
    const states = new Map<string, CalendarDayState<RandomQuestionCalendarDayKey>>();

    for (const date of savedDates) {
      states.set(date, {
        key: 'saved',
        tone: 'saved',
        title: `${date} has a saved set`,
      });
    }

    for (const plannedDay of plannedDays) {
      states.set(plannedDay.showDate, {
        key: 'planned',
        tone: 'planned',
        title: `${plannedDay.showDate} has a planned set`,
      });
    }

    return states;
  }, [plannedDays, savedDates]);

  const openRangeDialog = useCallback(() => {
    setRangeSelection({ startDate: selectedDate, endDate: selectedDate });
    onPlannedDaysChange([]);
    onPreviewStateChange({ data: null, loading: false, error: null });
    setRangeDialogOpen(true);
  }, [onPlannedDaysChange, onPreviewStateChange, selectedDate]);

  const handleToolbarAction = useCallback(() => {
    if (plannedDays.length > 0) {
      onOpenPlanActions();
      return;
    }

    openRangeDialog();
  }, [onOpenPlanActions, openRangeDialog, plannedDays.length]);

  async function handleRangeApply(nextRange: RandomCalendarRange) {
    setRangeSelection(nextRange);
    if (!nextRange.startDate || !nextRange.endDate) {
      onPlannedDaysChange([]);
      onPreviewStateChange({ data: null, loading: false, error: null });
      return;
    }

    const response = await fetch('/api/random-questions/plan-range', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snapshotVersion: activeSnapshotVersion,
        startDate: nextRange.startDate,
        endDate: nextRange.endDate,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      if (response.status === 409 && isSnapshotVersionMismatchResponse(errorBody)) {
        onPlannedDataOutdatedChange(true);
        onPlannedDaysChange([]);
        onPreviewStateChange({ data: null, loading: false, error: 'Planned data is outdated. Refresh required.' });
        return;
      }
      onPlannedDaysChange([]);
      onPreviewStateChange({ data: null, loading: false, error: `Request failed with status ${response.status}` });
      return;
    }

    const result = (await response.json()) as RandomQuestionPlanRangeResult;
    onSnapshotVersionChange(result.snapshotVersion);
    const nextPlannedDays = result.plannedDates.map((item) => toPlannedDay(item, result.snapshotVersion));

    if (nextPlannedDays.length === 0) {
      onPlannedDaysChange([]);
      onPreviewStateChange({ data: null, loading: false, error: 'No planned groups available for this range.' });
      return;
    }

    onPlannedDaysChange((current) => [
      ...current.filter((item) => !nextPlannedDays.some((nextItem) => nextItem.showDate === item.showDate)),
      ...nextPlannedDays,
    ]);
    setRangeSelection(createEmptyRange());
    onSelectedDateChange(nextPlannedDays[0].showDate);
    onPreviewStateChange({ data: nextPlannedDays[0].preview, loading: false, error: null });
    onShowDetailsPanel();
  }

  return (
    <>
      <CalendarStatusView
        selectedDate={selectedDate}
        dayStates={dayStates}
        onSelectedDateChange={onSelectedDateChange}
        action={{
          icon:
            plannedDays.length > 0 ? (
              <CalendarClockIcon className="h-4 w-4" />
            ) : (
              <CalendarDaysIcon className="h-4 w-4" />
            ),
          label: plannedDays.length > 0 ? 'Open planned actions' : 'Select date range',
          onPress: handleToolbarAction,
        }}
      />
      <RandomDateRangeDialog
        open={rangeDialogOpen}
        value={rangeSelection}
        anchorDate={selectedDate}
        defaultRangeDays={5}
        loadingFullPage={false}
        loadingActions={['confirm']}
        onOpenChange={(open) => {
          setRangeDialogOpen(open);
          if (!open) {
            setRangeSelection(createEmptyRange());
          }
        }}
        onClear={(nextRange) => {
          setRangeSelection(nextRange);
          onPlannedDaysChange([]);
          onPreviewStateChange({ data: null, loading: false, error: null });
          if (nextRange.startDate) {
            onSelectedDateChange(nextRange.startDate);
          }
        }}
        onApply={async (nextRange) => {
          await handleRangeApply(nextRange);
        }}
      />
    </>
  );
}
