'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@windrun-huaiin/base-ui/icons';
import { XButton } from '@windrun-huaiin/third-ui/main';
import type { QuestionImportValidationItem } from '@/server/questions/types';
import { buildAnswerOptionDrafts, type QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionFormCopy, QuestionImportCopy } from './question-copy';
import { QuestionForm } from './question-form';
import type { QuestionFormValues } from './question-ui-types';

const CDN_IMAGE_PREFIX = process.env.NEXT_PUBLIC_STYLE_CDN_IMG_PREFIX?.trim() ?? '';

type QuestionImportToFixProps = {
  item: QuestionImportValidationItem;
  index: number;
  total: number;
  revalidating: boolean;
  copy: QuestionImportCopy['workbench'];
  formCopy: QuestionFormCopy;
  onPrevious: () => void;
  onNext: () => void;
  onRemove: () => void;
  onRevalidate: () => void;
  onChange: (nextValues: QuestionFormValues) => void;
  onAnswerOptionsChange: (options: QuestionAnswerOptionDraft[]) => void;
};

function itemToFormValues(item: QuestionImportValidationItem): QuestionFormValues {
  return {
    question: item.question,
    cdnImagePrefix: CDN_IMAGE_PREFIX || item.cdnImagePrefix,
    questionImage: item.questionImage,
    correctAnswer: item.correctAnswer,
    incorrectAnswersText: item.incorrectAnswers.join('\n'),
    explanation: item.explanation,
    difficulty: item.difficulty,
    category: item.category,
    subCategory: item.subCategory ?? '',
    tags: item.tags,
    asFirst: item.asFirst,
  };
}

export function QuestionImportToFix({
  item,
  index,
  total,
  revalidating,
  copy,
  formCopy,
  onPrevious,
  onNext,
  onRemove,
  onRevalidate,
  onChange,
  onAnswerOptionsChange,
}: QuestionImportToFixProps) {
  const values = itemToFormValues(item);
  const answerOptions = buildAnswerOptionDrafts(item.correctAnswer, item.incorrectAnswers, item.correctAnswerIndex ?? 0);

  return (
    <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{copy.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {copy.itemProgress.replace('{current}', String(index + 1)).replace('{total}', String(total))}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{item.importId}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={index === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <QuestionForm
          values={values}
          answerOptions={answerOptions}
          onAnswerOptionsChange={onAnswerOptionsChange}
          onChange={onChange}
          fieldErrors={item.fieldErrors}
          usb={formCopy}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <XButton
          type="single"
          variant="subtle"
          minWidth="min-w-0"
          className="px-4 py-2.5"
          button={{
            icon: false,
            text: copy.removeCurrent,
            onClick: onRemove,
          }}
        />
        <XButton
          type="single"
          variant="subtle"
          minWidth="min-w-0"
          className="px-4 py-2.5"
          loadingText={copy.validating}
          button={{
            icon: false,
            text: copy.validateCurrent,
            onClick: onRevalidate,
            disabled: revalidating,
          }}
        />
      </div>
    </div>
  );
}
