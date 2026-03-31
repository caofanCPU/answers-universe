'use client';

import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFilterPills } from '@/components/pill-select';

type QuestionListFiltersProps = {
  id: string;
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
    idLabel: string;
    idPlaceholder: string;
    uuidLabel: string;
    uuidPlaceholder: string;
    firstLabel: string;
  };
  onIdChange: (value: string) => void;
  onUuidChange: (value: string) => void;
  onAsFirstChange: (value: boolean) => void;
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
};

export function QuestionListFilters(props: QuestionListFiltersProps) {
  const {
    id,
    uuid,
    uuidInvalid,
    asFirst,
    category,
    subCategory,
    difficulty,
    copy,
    onIdChange,
    onUuidChange,
    onAsFirstChange,
    onCategoryChange,
    onSubCategoryChange,
    onDifficultyChange,
  } = props;

  const categoryOptions = QUESTION_CATEGORIES.map((option) => ({ label: option, value: option }));
  const subCategoryOptions = QUESTION_SUB_CATEGORIES.map((option) => ({ label: option, value: option }));
  const difficultyOptions = QUESTION_DIFFICULTIES.map((option) => ({ label: option, value: option }));

  return (
    <div className="space-y-3 rounded-3xl border border-black/10 p-3.5 dark:border-white/10 lg:space-y-4 lg:p-4">
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
          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{copy.idLabel}</div>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={id}
              onChange={(event) => onIdChange(event.target.value.replace(/\D+/g, ''))}
              placeholder={copy.idPlaceholder}
              className="min-h-9 w-full rounded-full border border-black/10 bg-transparent px-3 py-1.5 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-500 hover:border-black/20 focus:border-black/20 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-white/20 dark:focus:border-white/20"
            />
            {id ? (
              <button
                type="button"
                onClick={() => onIdChange('')}
                className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-200"
                aria-label="Clear ID"
                title="Clear ID"
              >
                <icons.X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </label>

        <label className="space-y-2 min-w-0">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{copy.uuidLabel}</div>
          <div className="relative">
            <input
              type="text"
              value={uuid}
              onChange={(event) => onUuidChange(event.target.value.trim().toLowerCase())}
              placeholder={copy.uuidPlaceholder}
              className={`min-h-9 w-full rounded-full bg-transparent px-3 py-1.5 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                uuidInvalid
                  ? 'border border-red-300 focus:border-red-400 hover:border-red-400 dark:border-red-400/60 dark:hover:border-red-400 dark:focus:border-red-400'
                  : 'border border-black/10 hover:border-black/20 focus:border-black/20 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-white/20'
              }`}
            />
            {uuid ? (
              <button
                type="button"
                onClick={() => onUuidChange('')}
                className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-200"
                aria-label="Clear UUID"
                title="Clear UUID"
              >
                <icons.X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </label>

        <label className="flex min-h-9 items-end">
          <span className="flex min-h-9 w-full items-center gap-2 px-1 py-1.5 text-xs text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={asFirst}
              onChange={(event) => onAsFirstChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/10"
            />
            <span className="truncate">{copy.firstLabel}</span>
          </span>
        </label>
      </div>
    </div>
  );
}
