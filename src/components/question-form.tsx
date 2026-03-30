'use client';

import type { QuestionFormValues } from './question-ui-types';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFormPills, XTokenInput } from '@/components/pill-select';

type QuestionFormProps = {
  values: QuestionFormValues;
  onChange: (next: QuestionFormValues) => void;
  copy: {
    question: string;
    categoryLabel: string;
    categoryEmpty: string;
    subCategoryLabel: string;
    subCategoryEmpty: string;
    difficultyLabel: string;
    difficultyEmpty: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    tagsEmpty: string;
    correctAnswer: string;
    incorrectAnswersLabel: string;
    incorrectAnswersPlaceholder: string;
    explanation: string;
    cdnImagePrefix: string;
    questionImage: string;
    isFirst: string;
  };
};

function updateField(
  values: QuestionFormValues,
  onChange: (next: QuestionFormValues) => void,
  field: keyof QuestionFormValues,
  value: string | string[] | boolean
) {
  onChange({
    ...values,
    [field]: value,
  });
}

export function QuestionForm({ values, onChange, copy }: QuestionFormProps) {
  const categoryOptions = QUESTION_CATEGORIES.map((option) => ({ label: option, value: option }));
  const subCategoryOptions = QUESTION_SUB_CATEGORIES.map((option) => ({ label: option, value: option }));
  const difficultyOptions = QUESTION_DIFFICULTIES.map((option) => ({ label: option, value: option }));

  const onInputChange =
    (field: keyof QuestionFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === 'isFirst'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      updateField(values, onChange, field, value);
    };

  return (
    <form className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.question}</span>
          <textarea
            value={values.question}
            onChange={onInputChange('question')}
            rows={4}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <XFormPills
          label={copy.categoryLabel}
          value={values.category}
          options={categoryOptions}
          onChange={(value) => updateField(values, onChange, 'category', value)}
          emptyLabel={copy.categoryEmpty}
        />
        <XFormPills
          label={copy.subCategoryLabel}
          value={values.subCategory}
          options={subCategoryOptions}
          onChange={(value) => updateField(values, onChange, 'subCategory', value)}
          emptyLabel={copy.subCategoryEmpty}
        />
        <XFormPills
          label={copy.difficultyLabel}
          value={values.difficulty}
          options={difficultyOptions}
          onChange={(value) => updateField(values, onChange, 'difficulty', value)}
          emptyLabel={copy.difficultyEmpty}
        />
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.tagsLabel}</span>
          <XTokenInput
            value={values.tags}
            onChange={(nextValue) => updateField(values, onChange, 'tags', nextValue)}
            placeholder={copy.tagsPlaceholder}
            emptyLabel={copy.tagsEmpty}
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.correctAnswer}</span>
          <input
            value={values.correctAnswer}
            onChange={onInputChange('correctAnswer')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.incorrectAnswersLabel}</span>
          <textarea
            value={values.incorrectAnswersText}
            onChange={onInputChange('incorrectAnswersText')}
            rows={4}
            placeholder={copy.incorrectAnswersPlaceholder}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.explanation}</span>
          <textarea
            value={values.explanation}
            onChange={onInputChange('explanation')}
            rows={5}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.cdnImagePrefix}</span>
          <input
            value={values.cdnImagePrefix}
            onChange={onInputChange('cdnImagePrefix')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{copy.questionImage}</span>
          <input
            value={values.questionImage}
            onChange={onInputChange('questionImage')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
        <input
          type="checkbox"
          checked={values.isFirst}
          onChange={onInputChange('isFirst')}
          className="h-4 w-4 rounded border-black/10"
        />
        <span>{copy.isFirst}</span>
      </label>
    </form>
  );
}
