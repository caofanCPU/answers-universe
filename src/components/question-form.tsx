'use client';

import type { QuestionFormValues } from './question-ui-types';
import { QuestionAnswerOptions, type QuestionAnswerOptionDraft } from './question-answer-options';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFormPills, XTokenInput } from '@/components/pill-select';

type QuestionFormProps = {
  values: QuestionFormValues;
  answerOptions: QuestionAnswerOptionDraft[];
  onAnswerOptionsChange: (options: QuestionAnswerOptionDraft[]) => void;
  onChange: (next: QuestionFormValues) => void;
  copy: {
    question: string;
    answersLabel: string;
    answersPlaceholder: string;
    answersEmpty: string;
    answersExpand: string;
    answersCollapse: string;
    answersCorrectPrefix: string;
    answersNoCorrect: string;
    categoryLabel: string;
    categoryEmpty: string;
    subCategoryLabel: string;
    subCategoryEmpty: string;
    difficultyLabel: string;
    difficultyEmpty: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    tagsEmpty: string;
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

export function QuestionForm({ values, answerOptions, onAnswerOptionsChange, onChange, copy }: QuestionFormProps) {
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
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.question}</div>
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
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.tagsLabel}</div>
          <XTokenInput
            value={values.tags}
            onChange={(nextValue) => updateField(values, onChange, 'tags', nextValue)}
            placeholder={copy.tagsPlaceholder}
            emptyLabel={copy.tagsEmpty}
          />
        </div>
        <label className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.answersLabel}</div>
          <QuestionAnswerOptions
            options={answerOptions}
            onChange={onAnswerOptionsChange}
            copy={{
              placeholder: copy.answersPlaceholder,
              empty: copy.answersEmpty,
              expand: copy.answersExpand,
              collapse: copy.answersCollapse,
              correctPrefix: copy.answersCorrectPrefix,
              noCorrect: copy.answersNoCorrect,
            }}
            showCorrectState
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.explanation}</div>
          <textarea
            value={values.explanation}
            onChange={onInputChange('explanation')}
            rows={5}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.cdnImagePrefix}</div>
          <input
            value={values.cdnImagePrefix}
            onChange={onInputChange('cdnImagePrefix')}
            className="min-h-11 w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-200">{copy.questionImage}</div>
          <input
            value={values.questionImage}
            onChange={onInputChange('questionImage')}
            className="min-h-11 w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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
