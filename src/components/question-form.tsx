'use client';

import type { QuestionFormValues } from './question-ui-types';
import { QuestionAnswerOptions, type QuestionAnswerOptionDraft } from './question-answer-options';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFormPills, XTokenInput } from '@/components/pill-select';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';

type QuestionFormProps = {
  values: QuestionFormValues;
  answerOptions: QuestionAnswerOptionDraft[];
  onAnswerOptionsChange: (options: QuestionAnswerOptionDraft[]) => void;
  onChange: (next: QuestionFormValues) => void;
  questionNotice?: string;
  usb: {
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

function normalizeQuestionImagePath(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.toLowerCase().endsWith('.webp') ? trimmed : `${trimmed}.webp`;
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export function QuestionForm({
  values,
  answerOptions,
  onAnswerOptionsChange,
  onChange,
  questionNotice,
  usb: usb,
}: QuestionFormProps) {
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
    <form className="space-y-5 rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="font-medium text-slate-700 dark:text-slate-200">
              {usb.question} <RequiredMark />
            </div>
            {questionNotice ? (
              <div className="group relative inline-flex">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 focus-visible:bg-black/5 focus-visible:text-slate-700 focus-visible:outline-none dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:bg-white/5 dark:focus-visible:text-white"
                  aria-label={questionNotice}
                >
                  <icons.CircleQuestionMark className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden w-72 -translate-y-1/2 rounded-2xl border border-black/10 px-3 py-2 text-xs leading-5 text-slate-600 shadow-xl group-hover:block group-focus-within:block dark:border-white/10 dark:text-slate-300">
                  {questionNotice}
                </div>
              </div>
            ) : null}
          </div>
          <textarea
            value={values.question}
            onChange={onInputChange('question')}
            rows={4}
            className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">
            {usb.answersLabel} <RequiredMark />
          </div>
          <QuestionAnswerOptions
            options={answerOptions}
            onChange={onAnswerOptionsChange}
            copy={{
              placeholder: usb.answersPlaceholder,
              empty: usb.answersEmpty,
              expand: usb.answersExpand,
              collapse: usb.answersCollapse,
              correctPrefix: usb.answersCorrectPrefix,
              noCorrect: usb.answersNoCorrect,
            }}
            showCorrectState
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">
            {usb.explanation} <RequiredMark />
          </div>
          <textarea
            value={values.explanation}
            onChange={onInputChange('explanation')}
            rows={5}
            className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-200">{usb.cdnImagePrefix}</div>
          <input
            value={values.cdnImagePrefix}
            readOnly
            className="min-h-11 w-full rounded-2xl border border-black/10 px-4 py-2.5 text-slate-500 outline-none dark:border-white/10 dark:text-slate-400"
          />
        </label>
        <label className="space-y-2 text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-200">{usb.questionImage}</div>
          <input
            value={values.questionImage}
            onChange={onInputChange('questionImage')}
            onBlur={() =>
              updateField(values, onChange, 'questionImage', normalizeQuestionImagePath(values.questionImage))
            }
            className="min-h-11 w-full rounded-2xl border border-black/10 px-4 py-2.5 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white"
          />
        </label>
        <XFormPills
          label={
            <>
              {usb.categoryLabel} <RequiredMark />
            </>
          }
          value={values.category}
          options={categoryOptions}
          onChange={(value) => updateField(values, onChange, 'category', value)}
          emptyLabel={usb.categoryEmpty}
        />
        <XFormPills
          label={
            <>
              {usb.subCategoryLabel}
            </>
          }
          value={values.subCategory}
          options={subCategoryOptions}
          onChange={(value) => updateField(values, onChange, 'subCategory', value)}
          emptyLabel={usb.subCategoryEmpty}
          allowClear
        />
        <XFormPills
          label={
            <>
              {usb.difficultyLabel} <RequiredMark />
            </>
          }
          value={values.difficulty}
          options={difficultyOptions}
          onChange={(value) => updateField(values, onChange, 'difficulty', value)}
          emptyLabel={usb.difficultyEmpty}
        />
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="font-medium text-slate-700 dark:text-slate-200">{usb.tagsLabel}</div>
          <XTokenInput
            value={values.tags}
            onChange={(nextValue) => updateField(values, onChange, 'tags', nextValue)}
            placeholder={usb.tagsPlaceholder}
            emptyLabel={usb.tagsEmpty}
          />
        </div>
        <label className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
          <input
            type="checkbox"
            checked={values.isFirst}
            onChange={onInputChange('isFirst')}
            className="h-4 w-4 rounded border-black/10"
          />
          <span>{usb.isFirst}</span>
        </label>
      </div>
    </form>
  );
}
