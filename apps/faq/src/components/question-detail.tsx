import Image from 'next/image';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBgColor, themeBorderColor, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import type { QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionPreviewCopy } from './question-copy';
import type { QuestionViewModel } from './question-ui-types';

type QuestionDetailProps = {
  locale?: string;
  question: QuestionViewModel;
  answerOptions: QuestionAnswerOptionDraft[];
  copy?: QuestionPreviewCopy;
  previewAsPlayer?: boolean;
};

const DEFAULT_PREVIEW_COPY: QuestionPreviewCopy = {
  firstBadge: 'First',
  previewDescription: 'This is the full preview for the current question.',
  options: 'Options',
  explanation: 'Explanation',
  tags: 'Tags',
};

export function QuestionDetail({
  locale: _locale,
  question,
  answerOptions,
  copy = DEFAULT_PREVIEW_COPY,
  previewAsPlayer = false,
}: QuestionDetailProps) {
  const options = answerOptions.filter((option) => option.text.trim());
  const metaPillClassName =
    cn(
      'inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold transition',
      themeBgColor,
      themeIconColor
    );

  return (
    <div className="w-full min-w-0 space-y-6 rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {question.category ? <span className={metaPillClassName}>{question.category}</span> : null}
          {question.subCategory ? <span className={metaPillClassName}>{question.subCategory}</span> : null}
          {question.difficulty ? <span className={metaPillClassName}>{question.difficulty}</span> : null}
          {question.asFirst ? (
            <span className="inline-flex max-w-full items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 transition dark:bg-amber-500/10 dark:text-amber-300">
              {copy.firstBadge}
            </span>
          ) : null}
        </div>
        <h2 className="min-w-0 wrap-break-word text-2xl font-semibold text-slate-900 dark:text-white">{question.question}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {copy.previewDescription}
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {copy.options}
        </div>
        <div className="grid gap-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={cn(
                'flex min-w-0 items-center gap-3 rounded-2xl border border-black/10 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200',
                !previewAsPlayer && option.isCorrect && [themeBorderColor, themeIconColor]
              )}
            >
              <span
                className={cn(
                  'font-semibold text-slate-500 dark:text-slate-400',
                  !previewAsPlayer && option.isCorrect && themeIconColor
                )}
              >
                {String.fromCharCode(65 + index)}.
              </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 wrap-break-word',
                    !previewAsPlayer && option.isCorrect && themeIconColor
                  )}
                >
                {option.text}
              </span>
              {!previewAsPlayer && option.isCorrect ? <icons.Check className="h-4 w-4 shrink-0" /> : null}
            </div>
          ))}
        </div>
      </div>

      {!previewAsPlayer ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {copy.explanation}
          </div>
          <div className="min-w-0 wrap-break-word rounded-2xl border border-black/10 px-4 py-4 text-sm leading-7 text-slate-700 dark:border-white/10 dark:text-slate-200">
            {question.explanation}
          </div>
        </div>
      ) : null}

      {question.questionImageUrl ? (
        <div
          className={cn(
            'overflow-hidden rounded-3xl border border-black/10 dark:border-white/10',
            previewAsPlayer ? 'mx-auto max-h-60 max-w-xs' : 'mx-auto max-h-112 max-w-xl'
          )}
        >
          <Image
            src={question.questionImageUrl}
            alt={question.question}
            width={420}
            height={236}
            className={cn(
              'mx-auto',
              previewAsPlayer ? 'h-60 w-auto object-contain' : 'max-h-112 w-auto object-contain'
            )}
            sizes={previewAsPlayer ? '(max-width: 768px) 240px, 240px' : '(max-width: 1024px) 70vw, 420px'}
          />
        </div>
      ) : null}

      {!previewAsPlayer && question.tags.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {copy.tags}
          </div>
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <span key={tag} className={metaPillClassName}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
