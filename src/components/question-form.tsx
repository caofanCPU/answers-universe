'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import type { QuestionFormValues } from './question-ui-types';
import { QuestionAnswerOptions, type QuestionAnswerOptionDraft } from './question-answer-options';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFormPills, XTokenInput } from '@/components/pill-select';
import { InfoTooltip } from './info-tooltip';

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
    asFirst: string;
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
  const questionFieldId = useId();
  const questionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const categoryOptions = QUESTION_CATEGORIES.map((option) => ({ label: option, value: option }));
  const subCategoryOptions = QUESTION_SUB_CATEGORIES.map((option) => ({ label: option, value: option }));
  const difficultyOptions = QUESTION_DIFFICULTIES.map((option) => ({ label: option, value: option }));

  useLayoutEffect(() => {
    const element = questionTextareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = '0px';
    element.style.height = `${element.scrollHeight}px`;
  }, [values.question]);

  const onInputChange =
    (field: keyof QuestionFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === 'asFirst'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      updateField(values, onChange, field, value);
    };

  return (
    <form className="w-full min-w-0 space-y-5 rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-center gap-2">
            <label htmlFor={questionFieldId} className="font-medium text-slate-700 dark:text-slate-200">
              {usb.question} <RequiredMark />
            </label>
            {questionNotice ? <InfoTooltip content={questionNotice} /> : null}
          </div>
          <textarea
            id={questionFieldId}
            ref={questionTextareaRef}
            value={values.question}
            onChange={onInputChange('question')}
            rows={1}
            className="min-h-32 w-full min-w-0 resize-none rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white"
          />
        </div>
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
            className="w-full min-w-0 rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white"
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
            checked={values.asFirst}
            onChange={onInputChange('asFirst')}
            className="h-4 w-4 rounded border-black/10"
          />
          <span>{usb.asFirst}</span>
        </label>
      </div>
    </form>
  );
}
