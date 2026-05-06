'use client';

import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';
import { BrushCleaningIcon, ChevronDownIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { cn } from '@windrun-huaiin/lib/utils';
import { XFilterPills } from '@windrun-huaiin/third-ui/main/pill-select';
import { CalendarDateRangeInput } from '@windrun-huaiin/third-ui/main/calendar';
import { usePressFeedback } from  '@windrun-huaiin/third-ui/main/buttons';

type QuestionListFiltersProps = {
  question: string;
  correctAnswer: string;
  createdAtFrom: string;
  createdAtTo: string;
  id: string;
  idInvalid: boolean;
  uuid: string;
  uuidInvalid: boolean;
  asFirst: boolean;
  category: string;
  subCategory: string;
  difficulty: string;
  copy: {
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
  onQuestionChange: (value: string) => void;
  onCorrectAnswerChange: (value: string) => void;
  onCreatedAtFromChange: (value: string) => void;
  onCreatedAtToChange: (value: string) => void;
  onIdChange: (value: string) => void;
  onUuidChange: (value: string) => void;
  onAsFirstChange: (value: boolean) => void;
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onClearAll: () => void;
};

const CLEAR_FILTERS_BUTTON_BASE_CLASS_NAME =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-out';
const CLEAR_FILTERS_BUTTON_REST_CLASS_NAME =
  'border-black/10 text-slate-600 hover:border-black/20 hover:bg-black/5 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white';
const CLEAR_FILTERS_BUTTON_PRESSED_CLASS_NAME =
  'translate-y-[2px] scale-[0.94] border-black/30 bg-black/10 text-slate-950 shadow-[inset_0_2px_4px_rgba(15,23,42,0.18)] dark:border-white/25 dark:bg-white/20 dark:text-white dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.14)]';

type PressedFilterButton = 'clearFilters';

function FilterTextInput({
  label,
  value,
  placeholder,
  onChange,
  onClear,
  invalid = false,
  inputMode,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
  invalid?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label className="space-y-2 min-w-0">
      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</div>
      <div className="relative">
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`min-h-9 w-full rounded-full bg-transparent px-3 py-1.5 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400 ${
            invalid
              ? 'border border-red-300 focus:border-red-400 hover:border-red-400 dark:border-red-400/60 dark:hover:border-red-400 dark:focus:border-red-400'
              : 'border border-black/10 hover:border-black/20 focus:border-black/20 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-white/20'
          }`}
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-200"
            aria-label={`Clear ${label}`}
            title={`Clear ${label}`}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function QuestionListFilters(props: QuestionListFiltersProps) {
  const {
    question,
    correctAnswer,
    createdAtFrom,
    createdAtTo,
    id,
    idInvalid,
    uuid,
    uuidInvalid,
    asFirst,
    category,
    subCategory,
    difficulty,
    copy,
    onQuestionChange,
    onCorrectAnswerChange,
    onCreatedAtFromChange,
    onCreatedAtToChange,
    onIdChange,
    onUuidChange,
    onAsFirstChange,
    onCategoryChange,
    onSubCategoryChange,
    onDifficultyChange,
    onClearAll,
  } = props;

  const categoryOptions = QUESTION_CATEGORIES.map((option) => ({ label: option, value: option }));
  const subCategoryOptions = QUESTION_SUB_CATEGORIES.map((option) => ({ label: option, value: option }));
  const difficultyOptions = QUESTION_DIFFICULTIES.map((option) => ({ label: option, value: option }));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const {
    pressedKey: pressedFilterButton,
    flash: flashFilterButtonPress,
    getPressProps: getFilterButtonPressProps,
  } = usePressFeedback<PressedFilterButton>();
  const hasDateRangeFilter = Boolean(createdAtFrom.trim() || createdAtTo.trim());
  const activeAdvancedFilterCount = [
    correctAnswer.trim(),
    category.trim(),
    subCategory.trim(),
    difficulty.trim(),
    hasDateRangeFilter ? 'date-range' : '',
    uuid.trim(),
  ].filter(Boolean).length;
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  return (
    <>
      <div className="space-y-3 rounded-3xl border border-black/10 p-3.5 dark:border-white/10 lg:space-y-4 lg:p-4">
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          <FilterTextInput
            label={copy.questionLabel}
            value={question}
            placeholder={copy.questionPlaceholder}
            onChange={onQuestionChange}
            onClear={() => onQuestionChange('')}
          />
          <FilterTextInput
            label={copy.idLabel}
            value={id}
            placeholder={copy.idPlaceholder}
            onChange={(value) => onIdChange(value.replace(/\D+/g, ''))}
            onClear={() => onIdChange('')}
            invalid={idInvalid}
            inputMode="numeric"
          />
          <div className="space-y-2 min-w-0">
            <div className="text-xs font-medium text-transparent select-none">placeholder</div>
            <div className="flex min-h-9 items-center justify-between gap-3 px-1 text-xs text-slate-700 dark:text-slate-200">
              <label className="flex h-9 items-center gap-2">
                <input
                  type="checkbox"
                  checked={asFirst}
                  onChange={(event) => onAsFirstChange(event.target.checked)}
                  className="h-4 w-4 rounded border-black/10"
                />
                <span className="truncate">{copy.firstLabel}</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  flashFilterButtonPress('clearFilters');
                  onClearAll();
                }}
                className={cn(
                  CLEAR_FILTERS_BUTTON_BASE_CLASS_NAME,
                  pressedFilterButton === 'clearFilters'
                    ? CLEAR_FILTERS_BUTTON_PRESSED_CLASS_NAME
                    : CLEAR_FILTERS_BUTTON_REST_CLASS_NAME
                )}
                {...getFilterButtonPressProps('clearFilters')}
                aria-label="Clear all filters"
                title="Clear all filters"
              >
                <BrushCleaningIcon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Clear filters</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 pt-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className={`flex w-full items-center gap-2 rounded-2xl px-1 py-1 text-left text-xs font-medium transition ${
              !advancedOpen && hasActiveAdvancedFilters
                ? 'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200'
                : 'text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white'
            }`}
          >
            <ChevronDownIcon className={`h-4 w-4 transition ${advancedOpen ? 'rotate-180' : ''}`} />
            <span>{copy.advancedToggle}</span>
            {!advancedOpen && hasActiveAdvancedFilters ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-amber-300/80 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200">
                +{activeAdvancedFilterCount}
              </span>
            ) : null}
          </button>

          {advancedOpen ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
                <XFilterPills
                  label={copy.categoryLabel}
                  value={category}
                  options={categoryOptions}
                  onChange={onCategoryChange}
                  allLabel={copy.categoryAll}
                />
                <XFilterPills
                  label={copy.subCategoryLabel}
                  value={subCategory}
                  options={subCategoryOptions}
                  onChange={onSubCategoryChange}
                  allLabel={copy.subCategoryAll}
                />
                <XFilterPills
                  label={copy.difficultyLabel}
                  value={difficulty}
                  options={difficultyOptions}
                  onChange={onDifficultyChange}
                  allLabel={copy.difficultyAll}
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
                <label className="space-y-2">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{copy.dateRangeLabel}</div>
                  <CalendarDateRangeInput
                    value={{
                      startDate: createdAtFrom || null,
                      endDate: createdAtTo || null,
                    }}
                    onChange={(range) => {
                      onCreatedAtFromChange(range.startDate ?? '');
                      onCreatedAtToChange(range.endDate ?? '');
                    }}
                    placeholder={copy.dateRangePlaceholder}
                    defaultRangeDays={7}
                  />
                </label>
                <FilterTextInput
                  label={copy.correctAnswerLabel}
                  value={correctAnswer}
                  placeholder={copy.correctAnswerPlaceholder}
                  onChange={onCorrectAnswerChange}
                  onClear={() => onCorrectAnswerChange('')}
                />
                <FilterTextInput
                  label={copy.uuidLabel}
                  value={uuid}
                  placeholder={copy.uuidPlaceholder}
                  onChange={(value) => onUuidChange(value.trim().toLowerCase())}
                  onClear={() => onUuidChange('')}
                  invalid={uuidInvalid}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
