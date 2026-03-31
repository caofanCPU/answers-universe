'use client';

import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFilterPills } from '@/components/pill-select';

type QuestionListFiltersProps = {
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
  };
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
};

export function QuestionListFilters(props: QuestionListFiltersProps) {
  const {
    category,
    subCategory,
    difficulty,
    copy,
    onCategoryChange,
    onSubCategoryChange,
    onDifficultyChange,
  } = props;

  const categoryOptions = QUESTION_CATEGORIES.map((option) => ({ label: option, value: option }));
  const subCategoryOptions = QUESTION_SUB_CATEGORIES.map((option) => ({ label: option, value: option }));
  const difficultyOptions = QUESTION_DIFFICULTIES.map((option) => ({ label: option, value: option }));

  return (
    <div className="grid gap-3 rounded-3xl border border-black/10 p-3.5 dark:border-white/10 lg:grid-cols-3 lg:gap-4 lg:p-4">
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
  );
}
