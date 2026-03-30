'use client';

import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';

type QuestionListFiltersProps = {
  locale: string;
  category: string;
  subCategory: string;
  difficulty: string;
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
};

export function QuestionListFilters(props: QuestionListFiltersProps) {
  const {
    locale,
    category,
    subCategory,
    difficulty,
    onCategoryChange,
    onSubCategoryChange,
    onDifficultyChange,
  } = props;

  const isZh = locale === 'zh';

  return (
    <div className="grid gap-4 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-slate-950 md:grid-cols-3">
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '主分类' : 'Category'}
        </span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        >
          <option value="">{isZh ? '全部主分类' : 'All categories'}</option>
          {QUESTION_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '次分类' : 'Sub Category'}
        </span>
        <select
          value={subCategory}
          onChange={(event) => onSubCategoryChange(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        >
          <option value="">{isZh ? '全部次分类' : 'All sub categories'}</option>
          {QUESTION_SUB_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '难度' : 'Difficulty'}
        </span>
        <select
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        >
          <option value="">{isZh ? '全部难度' : 'All difficulties'}</option>
          {QUESTION_DIFFICULTIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
