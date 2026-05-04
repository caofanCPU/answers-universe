'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CoinsIcon, DatabaseZapIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';

export type RandomCalendarRange = {
  startDate: string | null;
  endDate: string | null;
};

export type RandomCalendarDayState = {
  state?: 'saved' | 'planned';
  title?: string;
};

type RandomCalendarViewProps = {
  selectedDate: string;
  dayStates: Map<string, RandomCalendarDayState>;
  onSelectedDateChange: (date: string) => void;
  onActionOpen: () => void;
  hasPlannedDays?: boolean;
};

type RandomDateRangeDialogProps = {
  open: boolean;
  value: RandomCalendarRange;
  anchorDate: string;
  onOpenChange: (open: boolean) => void;
  onApply: (range: RandomCalendarRange) => void;
  onClear?: (range: RandomCalendarRange) => void;
};

type QuickRangeDays = 7 | 10 | 15 | 30;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRACK_MIN_DAYS = 45;

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateString(date);
}

function compareDateStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function getInclusiveDayCount(range: RandomCalendarRange): number {
  if (!range.startDate || !range.endDate) {
    return 0;
  }

  const startTime = parseDateString(range.startDate).getTime();
  const endTime = parseDateString(range.endDate).getTime();

  return Math.max(0, Math.floor((endTime - startTime) / 86400000) + 1);
}

function getRangeLabel(range: RandomCalendarRange): string {
  if (!range.startDate || !range.endDate) {
    return 'No range selected';
  }

  if (range.startDate === range.endDate) {
    return range.startDate;
  }

  return `${range.startDate} ~ ${range.endDate}`;
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

function buildTrackRange(referenceDate: string, minDays = TRACK_MIN_DAYS): RandomCalendarRange {
  const startDate = addDays(referenceDate, -Math.floor(minDays / 3));
  const endDate = addDays(startDate, minDays - 1);
  return { startDate, endDate };
}

function clampDateToRange(date: string, bounds: RandomCalendarRange): string {
  if (!bounds.startDate || !bounds.endDate) {
    return date;
  }

  if (compareDateStrings(date, bounds.startDate) < 0) {
    return bounds.startDate;
  }

  if (compareDateStrings(date, bounds.endDate) > 0) {
    return bounds.endDate;
  }

  return date;
}

function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDateString(startDate).getTime();
  const end = parseDateString(endDate).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function getDateByRatio(bounds: RandomCalendarRange, ratio: number): string {
  if (!bounds.startDate || !bounds.endDate) {
    return getTodayString();
  }

  const totalDays = Math.max(1, getDaysBetween(bounds.startDate, bounds.endDate));
  return addDays(bounds.startDate, Math.round(totalDays * ratio));
}

function getRatioByDate(date: string, bounds: RandomCalendarRange): number {
  if (!bounds.startDate || !bounds.endDate) {
    return 0;
  }

  const totalDays = Math.max(1, getDaysBetween(bounds.startDate, bounds.endDate));
  const distance = getDaysBetween(bounds.startDate, clampDateToRange(date, bounds));
  return distance / totalDays;
}

function formatMonthShort(value: string): string {
  return parseDateString(value).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
}

export const RandomCalendarView = memo(function RandomCalendarView({
  selectedDate,
  dayStates,
  onSelectedDateChange,
  onActionOpen,
  hasPlannedDays = false,
}: RandomCalendarViewProps) {
  const [calendarMonth, setCalendarMonth] = useState(() => parseDateString(`${selectedDate.slice(0, 7)}-01`));
  const monthDays = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth]);
  const handlePreviousMonth = useCallback(() => {
    setCalendarMonth(
      new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() - 1, 1))
    );
  }, [calendarMonth]);
  const handleNextMonth = useCallback(() => {
    setCalendarMonth(
      new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() + 1, 1))
    );
  }, [calendarMonth]);
  const handleDayPress = useCallback((nextDate: string, year: number, month: number) => {
    onSelectedDateChange(nextDate);
    setCalendarMonth(new Date(Date.UTC(year, month, 1)));
  }, [onSelectedDateChange]);

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-black/10 p-3 dark:border-white/10 sm:p-4 xl:self-stretch">
      <div className="flex h-full flex-col space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{getMonthTitle(calendarMonth)}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onActionOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              aria-label={hasPlannedDays ? 'Open planned actions' : 'Select date range'}
              title={hasPlannedDays ? 'Open planned actions' : 'Select date range'}
            >
              {hasPlannedDays ? <CoinsIcon className="h-4 w-4" /> : <DatabaseZapIcon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const date = formatDateString(day);

            return (
              <CalendarDayButton
                key={date}
                date={date}
                label={String(day.getUTCDate())}
                currentMonth={day.getUTCMonth() === calendarMonth.getUTCMonth()}
                selected={date === selectedDate}
                dayState={dayStates.get(date)}
                onPress={handleDayPress}
                year={day.getUTCFullYear()}
                month={day.getUTCMonth()}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export function RandomDateRangeDialog({
  open,
  value,
  anchorDate,
  onOpenChange,
  onApply,
  onClear,
}: RandomDateRangeDialogProps) {
  const [draftRange, setDraftRange] = useState<RandomCalendarRange>(value);
  const [referenceDate, setReferenceDate] = useState(anchorDate);
  const [trackBounds, setTrackBounds] = useState<RandomCalendarRange>(() => buildTrackRange(anchorDate || getTodayString()));
  const [windowDays, setWindowDays] = useState<number>(1);
  const dragStartRangeRef = useRef<RandomCalendarRange | null>(null);
  const dragModeRef = useRef<'start' | 'end' | 'window' | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const windowDragOffsetDaysRef = useRef(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const startHandleRef = useRef<HTMLButtonElement | null>(null);
  const endHandleRef = useRef<HTMLButtonElement | null>(null);
  const resultLabelRef = useRef<HTMLDivElement | null>(null);
  const dragPreviewRef = useRef<RandomCalendarRange | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingClientXRef = useRef<number | null>(null);
  const syncPreviewDomRef = useRef<(range: RandomCalendarRange) => void>(() => {});
  const buildDraggedRangeRef = useRef<(clientX: number) => RandomCalendarRange | null>(() => null);
  const today = useMemo(() => getTodayString(), []);
  const baseReferenceDate = anchorDate || today;
  const previousOpenRef = useRef(false);
  const startRatio = getRatioByDate(draftRange.startDate ?? baseReferenceDate, trackBounds);
  const endRatio = getRatioByDate(draftRange.endDate ?? baseReferenceDate, trackBounds);
  const leftPercent = Math.min(startRatio, endRatio) * 100;
  const rightPercent = Math.max(startRatio, endRatio) * 100;
  const widthPercent = Math.max(rightPercent - leftPercent, 0.5);
  const isSingleDay = (draftRange.startDate ?? null) === (draftRange.endDate ?? null);
  const startHandlePercent = isSingleDay ? Math.max(leftPercent - 0.8, 0) : leftPercent;
  const endHandlePercent = isSingleDay ? Math.min(rightPercent + 0.8, 100) : rightPercent;
  const monthLabels = useMemo(() => {
    const values = [trackBounds.startDate, trackBounds.endDate]
      .filter((item): item is string => Boolean(item))
      .map((item) => formatMonthShort(item));

    return [...new Set(values)];
  }, [trackBounds.endDate, trackBounds.startDate]);

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      const nextRange = { startDate: baseReferenceDate, endDate: baseReferenceDate };
      setDraftRange(nextRange);
      setReferenceDate(baseReferenceDate);
      setTrackBounds(buildTrackRange(baseReferenceDate));
      setWindowDays(1);
      dragStartRangeRef.current = null;
      dragModeRef.current = null;
      pointerIdRef.current = null;
      dragPreviewRef.current = nextRange;
    }
    previousOpenRef.current = open;
  }, [baseReferenceDate, open]);

  function updateRangeByReference(nextReferenceDate: string, nextWindowDays: number, options?: { preserveTrack?: boolean }) {
    const nextRange = {
      startDate: nextReferenceDate,
      endDate: addDays(nextReferenceDate, Math.max(nextWindowDays - 1, 0)),
    };
    setReferenceDate(nextReferenceDate);
    setWindowDays(nextWindowDays);
    setDraftRange(nextRange);
    if (!options?.preserveTrack) {
      setTrackBounds(buildTrackRange(nextReferenceDate, Math.max(TRACK_MIN_DAYS, nextWindowDays + 20)));
    }
  }

  const getPreviewPercents = useCallback((range: RandomCalendarRange) => {
    const start = range.startDate ?? baseReferenceDate;
    const end = range.endDate ?? start;
    const startR = getRatioByDate(start, trackBounds);
    const endR = getRatioByDate(end, trackBounds);
    const left = Math.min(startR, endR) * 100;
    const right = Math.max(startR, endR) * 100;
    const width = Math.max(right - left, 0.5);
    const single = start === end;

    return {
      left,
      right,
      width,
      startHandle: single ? Math.max(left - 0.8, 0) : left,
      endHandle: single ? Math.min(right + 0.8, 100) : right,
    };
  }, [baseReferenceDate, trackBounds]);

  const syncPreviewDom = useCallback((range: RandomCalendarRange) => {
    const percents = getPreviewPercents(range);
    if (selectionRef.current) {
      selectionRef.current.style.left = `${percents.left}%`;
      selectionRef.current.style.width = `${percents.width}%`;
    }
    if (startHandleRef.current) {
      startHandleRef.current.style.left = `${percents.startHandle}%`;
    }
    if (endHandleRef.current) {
      endHandleRef.current.style.left = `${percents.endHandle}%`;
    }
    if (resultLabelRef.current) {
      resultLabelRef.current.textContent = getRangeLabel(range);
    }
  }, [getPreviewPercents]);

  useEffect(() => {
    dragPreviewRef.current = draftRange;
    syncPreviewDom(draftRange);
  }, [draftRange, syncPreviewDom]);

  function resetReferenceFromClientX(clientX: number) {
    if (!trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nextReferenceDate = getDateByRatio(trackBounds, ratio);
    updateRangeByReference(nextReferenceDate, 1, { preserveTrack: true });
  }

  function applyQuickRange(dayCount: QuickRangeDays) {
    updateRangeByReference(referenceDate, dayCount);
  }

  function shiftReferenceDate(daysOffset: number) {
    updateRangeByReference(addDays(referenceDate, daysOffset), windowDays);
  }

  function beginDrag(mode: 'start' | 'end' | 'window', pointerId: number, clientX?: number) {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    dragModeRef.current = mode;
    pointerIdRef.current = pointerId;
    dragStartRangeRef.current = { ...draftRange };
    dragPreviewRef.current = { ...draftRange };

    if (
      mode === 'window' &&
      clientX !== undefined &&
      trackRef.current &&
      draftRange.startDate &&
      draftRange.endDate &&
      trackBounds.startDate &&
      trackBounds.endDate
    ) {
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const pointerDate = getDateByRatio(trackBounds, ratio);
      windowDragOffsetDaysRef.current = getDaysBetween(draftRange.startDate, pointerDate);
    } else {
      windowDragOffsetDaysRef.current = 0;
    }
  }

  const buildDraggedRange = useCallback((clientX: number): RandomCalendarRange | null => {
    if (!dragModeRef.current || !dragStartRangeRef.current || !trackBounds.startDate || !trackBounds.endDate || !trackRef.current) {
      return null;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pointerDate = getDateByRatio(trackBounds, ratio);
    const currentRange = dragStartRangeRef.current;

    if (!currentRange.startDate || !currentRange.endDate) {
      return null;
    }

    if (dragModeRef.current === 'start') {
      const nextStart = compareDateStrings(pointerDate, currentRange.endDate) > 0 ? currentRange.endDate : pointerDate;
      return { startDate: nextStart, endDate: currentRange.endDate };
    }

    if (dragModeRef.current === 'end') {
      const nextEnd = compareDateStrings(pointerDate, currentRange.startDate) < 0 ? currentRange.startDate : pointerDate;
      return { startDate: currentRange.startDate, endDate: nextEnd };
    }

    const spanDays = getDaysBetween(currentRange.startDate, currentRange.endDate);
    const nextStart = clampDateToRange(addDays(pointerDate, -windowDragOffsetDaysRef.current), {
      startDate: trackBounds.startDate,
      endDate: addDays(trackBounds.endDate, -spanDays),
    });
    const nextEnd = addDays(nextStart, spanDays);
    return { startDate: nextStart, endDate: nextEnd };
  }, [trackBounds]);

  useEffect(() => {
    syncPreviewDomRef.current = syncPreviewDom;
    buildDraggedRangeRef.current = buildDraggedRange;
  }, [syncPreviewDom, buildDraggedRange]);

  function endDrag() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingClientXRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    const nextRange = dragPreviewRef.current;
    dragStartRangeRef.current = null;
    dragModeRef.current = null;
    pointerIdRef.current = null;
    windowDragOffsetDaysRef.current = 0;
    if (nextRange?.startDate && nextRange.endDate) {
      setDraftRange(nextRange);
      setReferenceDate(nextRange.startDate);
      setWindowDays(getInclusiveDayCount(nextRange));
    }
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleWindowPointerMove(event: PointerEvent) {
      if (dragModeRef.current === null) {
        return;
      }

      pendingClientXRef.current = event.clientX;
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingClientXRef.current === null) {
          return;
        }

        const nextRange = buildDraggedRangeRef.current(pendingClientXRef.current);
        if (nextRange) {
          dragPreviewRef.current = nextRange;
          syncPreviewDomRef.current(nextRange);
        }
      });
    }

    function handleWindowPointerUp(event: PointerEvent) {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
        return;
      }

      if (dragModeRef.current !== null) {
        endDrag();
      }
    }

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-120 select-none flex items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="space-y-5 p-4">
          <div className="relative flex items-center justify-center px-16 text-center">
            <div ref={resultLabelRef} className="select-none text-base font-semibold text-slate-900 dark:text-white">{getRangeLabel(draftRange)}</div>
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                aria-label="Cancel"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draftRange);
                  onOpenChange(false);
                }}
                disabled={!draftRange.startDate || !draftRange.endDate}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-100 dark:hover:text-white"
                aria-label="Apply"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftReferenceDate(-365)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                  aria-label="Previous year"
                  title="Previous year"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftReferenceDate(-30)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextRange = { startDate: baseReferenceDate, endDate: baseReferenceDate };
                    setReferenceDate(baseReferenceDate);
                    setTrackBounds(buildTrackRange(baseReferenceDate));
                    setWindowDays(1);
                    setDraftRange(nextRange);
                    onClear?.(nextRange);
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 sm:text-sm"
                >
                  Current Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextRange = {
                      startDate: referenceDate,
                      endDate: new Date(Date.UTC(
                        parseDateString(referenceDate).getUTCFullYear(),
                        parseDateString(referenceDate).getUTCMonth() + 1,
                        0
                      )).toISOString().slice(0, 10),
                    };
                    setDraftRange(nextRange);
                    setWindowDays(getInclusiveDayCount(nextRange));
                    setTrackBounds(buildTrackRange(referenceDate));
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 sm:text-sm"
                >
                  This Month
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftReferenceDate(30)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                  aria-label="Next month"
                  title="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftReferenceDate(365)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                  aria-label="Next year"
                  title="Next year"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative h-24">
              <div className="absolute inset-x-0 top-0 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <span className="relative select-none">
                  {monthLabels[0] ?? formatMonthShort(trackBounds.startDate ?? baseReferenceDate)}
                  <span className="pointer-events-none absolute left-1/2 top-7 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="pointer-events-none absolute left-1/2 top-[1.95rem] h-[1.9rem] w-0.5 -translate-x-1/2 bg-slate-400 dark:bg-slate-500" />
                </span>
                <div className="flex min-w-0 items-center justify-center gap-1">
                  {([
                    { label: '+7', days: 7 },
                    { label: '+10', days: 10 },
                    { label: '+15', days: 15 },
                    { label: '+30', days: 30 },
                  ] as const).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => applyQuickRange(item.days)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="relative select-none text-right">
                  {monthLabels[1] ?? formatMonthShort(trackBounds.endDate ?? baseReferenceDate)}
                  <span className="pointer-events-none absolute right-1/2 top-7 h-2.5 w-2.5 translate-x-1/2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="pointer-events-none absolute right-1/2 top-[1.95rem] h-[1.9rem] w-0.5 translate-x-1/2 bg-slate-400 dark:bg-slate-500" />
                </span>
              </div>

              <div
                className="absolute inset-x-0 top-[3.35rem] h-10 touch-none"
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  resetReferenceFromClientX(event.clientX);
                }}
              >
                <div
                  ref={trackRef}
                  className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-400/30 dark:bg-slate-500/25"
                >
                <div
                  ref={selectionRef}
                  className="absolute top-1/2 h-4 touch-none -translate-y-1/2 rounded-md border border-sky-500 bg-white dark:border-sky-300 dark:bg-slate-950"
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    beginDrag('window', event.pointerId, event.clientX);
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-xs font-semibold text-sky-700 dark:text-sky-100">
                    {`${getInclusiveDayCount(draftRange)}D`}
                  </div>
                </div>

                <button
                  ref={startHandleRef}
                  type="button"
                  className="absolute top-1/2 h-6 w-6 touch-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500 bg-white shadow-sm dark:border-sky-300 dark:bg-slate-950"
                  style={{ left: `${startHandlePercent}%` }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    beginDrag('start', event.pointerId);
                  }}
                  aria-label="Adjust start date"
                />
                <button
                  ref={endHandleRef}
                  type="button"
                  className="absolute top-1/2 h-6 w-6 touch-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500 bg-white shadow-sm dark:border-sky-300 dark:bg-slate-950"
                  style={{ left: `${endHandlePercent}%` }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    beginDrag('end', event.pointerId);
                  }}
                  aria-label="Adjust end date"
                />
              </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const CalendarDayButton = memo(function CalendarDayButton({
  date,
  label,
  currentMonth,
  selected,
  dayState,
  onPress,
  year,
  month,
}: {
  date: string;
  label: string;
  currentMonth: boolean;
  selected: boolean;
  dayState?: RandomCalendarDayState;
  onPress: (date: string, year: number, month: number) => void;
  year: number;
  month: number;
}) {
  const isSaved = dayState?.state === 'saved';
  const isPlanned = dayState?.state === 'planned';

  return (
    <button
      type="button"
      onClick={() => onPress(date, year, month)}
      className={cn(
        'relative flex h-11 select-none items-center justify-center rounded-2xl border text-sm transition',
        selected
          ? 'bg-black text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/5',
        isSaved
          ? 'border-emerald-300 dark:border-emerald-400'
          : isPlanned
            ? 'border-amber-300 dark:border-amber-400'
            : selected
              ? 'border-black/20 dark:border-white/20'
              : 'border-black/10 dark:border-white/10',
        currentMonth ? '' : 'opacity-45'
      )}
      title={dayState?.title ?? `Open ${date}`}
    >
      <span>{label}</span>
      {isSaved || isPlanned ? (
        <span
          className={cn(
            'absolute bottom-1 h-1.5 w-1.5 rounded-full',
            isSaved && 'bg-emerald-500 dark:bg-emerald-300',
            isPlanned && 'bg-amber-500 dark:bg-amber-300'
          )}
        />
      ) : null}
    </button>
  );
});
