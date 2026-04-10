'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import type { QuestionFormValues } from './question-ui-types';
import { QuestionAnswerOptions, type QuestionAnswerOptionDraft } from './question-answer-options';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';
import { XFormPills, XTokenInput } from '@windrun-huaiin/third-ui/main/pill-select';
import { InfoTooltip } from './info-tooltip';
import type { QuestionImportFieldErrors, QuestionImportFieldKey } from '@/server/questions/types';

type QuestionFormProps = {
  values: QuestionFormValues;
  answerOptions: QuestionAnswerOptionDraft[];
  onAnswerOptionsChange: (options: QuestionAnswerOptionDraft[]) => void;
  onChange: (next: QuestionFormValues) => void;
  questionNotice?: string;
  fieldErrors?: QuestionImportFieldErrors;
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

const questionFormFieldToImportField: Partial<Record<keyof QuestionFormValues, QuestionImportFieldKey>> = {
  question: 'question',
  questionImage: 'questionImage',
  explanation: 'explanation',
  difficulty: 'difficulty',
  category: 'category',
  subCategory: 'subCategory',
  tags: 'tags',
  asFirst: 'asFirst',
};

function getFieldError(
  fieldErrors: QuestionImportFieldErrors | undefined,
  field: keyof QuestionFormValues | 'answers'
): string | null {
  if (!fieldErrors) {
    return null;
  }

  if (field === 'answers') {
    return fieldErrors.incorrectAnswers ?? fieldErrors.correctAnswer ?? fieldErrors.correctAnswerIndex ?? null;
  }

  const mappedField = questionFormFieldToImportField[field];
  return mappedField ? fieldErrors[mappedField] ?? null : null;
}

function getFieldContainerClass(error: string | null, extraClassName?: string) {
  const baseClassName = extraClassName ? ` ${extraClassName}` : '';

  if (!error) {
    return baseClassName.trim();
  }

  return `rounded-2xl border border-red-300 bg-red-50/60 p-3 dark:border-red-500/40 dark:bg-red-500/10${baseClassName}`.trim();
}

function getTextInputClassName(error: string | null, extraClassName?: string) {
  const baseClassName = extraClassName ? ` ${extraClassName}` : '';

  if (!error) {
    return `w-full min-w-0 rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white${baseClassName}`;
  }

  return `w-full min-w-0 rounded-2xl border border-red-300 bg-red-50/60 px-4 py-3 outline-none transition focus:border-red-400 dark:border-red-500/40 dark:bg-red-500/10 dark:text-white${baseClassName}`;
}

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

const AS_FIRST_LABEL = 'Mark as first-release question';

function InlineTooltipLabel({
  label,
  required = false,
  tooltip,
}: {
  label: string;
  required?: boolean;
  tooltip?: string | null;
}) {
  return (
    <div className="flex w-full items-start justify-between gap-3 md:inline-flex md:w-auto md:justify-start">
      <span className="font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required ? (
          <>
            {' '}
            <RequiredMark />
          </>
        ) : null}
      </span>
      {tooltip ? <InfoTooltip content={tooltip} /> : null}
    </div>
  );
}

export function QuestionForm({
  values,
  answerOptions,
  onAnswerOptionsChange,
  onChange,
  questionNotice,
  fieldErrors,
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

  const questionError = getFieldError(fieldErrors, 'question');
  const answersError = getFieldError(fieldErrors, 'answers');
  const explanationError = getFieldError(fieldErrors, 'explanation');
  const questionImageError = getFieldError(fieldErrors, 'questionImage');
  const categoryError = getFieldError(fieldErrors, 'category');
  const subCategoryError = getFieldError(fieldErrors, 'subCategory');
  const difficultyError = getFieldError(fieldErrors, 'difficulty');
  const tagsError = getFieldError(fieldErrors, 'tags');
  const asFirstError = getFieldError(fieldErrors, 'asFirst');

  return (
    <form className="w-full min-w-0 space-y-5 rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <label htmlFor={questionFieldId} className="font-medium text-slate-700 dark:text-slate-200">
              {usb.question} <RequiredMark />
            </label>
            {questionError ? (
              <InfoTooltip content={questionError} className="md:-translate-y-px" />
            ) : questionNotice ? (
              <InfoTooltip content={questionNotice} className="md:-translate-y-px" />
            ) : null}
          </div>
          <textarea
            id={questionFieldId}
            ref={questionTextareaRef}
            value={values.question}
            onChange={onInputChange('question')}
            rows={1}
            className={getTextInputClassName(questionError, 'min-h-32 resize-none')}
          />
        </div>
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <div className="font-medium text-slate-700 dark:text-slate-200">
              {usb.answersLabel} <RequiredMark />
            </div>
            {answersError ? <InfoTooltip content={answersError} className="md:-translate-y-px" /> : null}
          </div>
          <div className={getFieldContainerClass(answersError)}>
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
          </div>
        </div>
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <div className="font-medium text-slate-700 dark:text-slate-200">
              {usb.explanation} <RequiredMark />
            </div>
            {explanationError ? <InfoTooltip content={explanationError} className="md:-translate-y-px" /> : null}
          </div>
          <textarea
            value={values.explanation}
            onChange={onInputChange('explanation')}
            rows={5}
            className={getTextInputClassName(explanationError)}
          />
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-200">{usb.cdnImagePrefix}</div>
          <input
            value={values.cdnImagePrefix}
            readOnly
            className="min-h-11 w-full rounded-2xl border border-black/10 px-4 py-2.5 text-slate-500 outline-none dark:border-white/10 dark:text-slate-400"
          />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <div className="font-medium text-slate-700 dark:text-slate-200">{usb.questionImage}</div>
            {questionImageError ? <InfoTooltip content={questionImageError} className="md:-translate-y-px" /> : null}
          </div>
          <input
            value={values.questionImage}
            onChange={onInputChange('questionImage')}
            onBlur={() =>
              updateField(values, onChange, 'questionImage', normalizeQuestionImagePath(values.questionImage))
            }
            className={getTextInputClassName(questionImageError, 'min-h-11 py-2.5')}
          />
        </div>
        <div className={getFieldContainerClass(categoryError)}>
          <XFormPills
            label={<InlineTooltipLabel label={usb.categoryLabel} required tooltip={categoryError} />}
            value={values.category}
            options={categoryOptions}
            onChange={(value) => updateField(values, onChange, 'category', value)}
            emptyLabel={usb.categoryEmpty}
          />
        </div>
        <div className={getFieldContainerClass(subCategoryError)}>
          <XFormPills
            label={<InlineTooltipLabel label={usb.subCategoryLabel} tooltip={subCategoryError} />}
            value={values.subCategory}
            options={subCategoryOptions}
            onChange={(value) => updateField(values, onChange, 'subCategory', value)}
            emptyLabel={usb.subCategoryEmpty}
            allowClear
          />
        </div>
        <div className={getFieldContainerClass(difficultyError)}>
          <XFormPills
            label={<InlineTooltipLabel label={usb.difficultyLabel} required tooltip={difficultyError} />}
            value={values.difficulty}
            options={difficultyOptions}
            onChange={(value) => updateField(values, onChange, 'difficulty', value)}
            emptyLabel={usb.difficultyEmpty}
          />
        </div>
        <div className="space-y-2 text-sm md:col-span-2">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <div className="font-medium text-slate-700 dark:text-slate-200">{usb.tagsLabel}</div>
            {tagsError ? <InfoTooltip content={tagsError} className="md:-translate-y-px" /> : null}
          </div>
          <div className={getFieldContainerClass(tagsError)}>
            <XTokenInput
              value={values.tags}
              onChange={(nextValue) => updateField(values, onChange, 'tags', nextValue)}
              placeholder={usb.tagsPlaceholder}
              emptyLabel={usb.tagsEmpty}
            />
          </div>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm md:col-span-2 ${
          asFirstError
            ? 'border border-red-300 dark:border-red-500/40'
            : 'text-slate-700 dark:text-slate-200'
        }`}>
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <input
              type="checkbox"
              checked={values.asFirst}
              onChange={onInputChange('asFirst')}
              className="h-4 w-4 rounded border-black/10"
            />
            <span>{AS_FIRST_LABEL}</span>
          </label>
          {asFirstError ? <InfoTooltip content={asFirstError} className="md:-translate-y-px" /> : null}
        </div>
      </div>
    </form>
  );
}
