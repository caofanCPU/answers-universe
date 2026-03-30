import Image from 'next/image';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBgColor, themeBorderColor, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import { SiteEyeIcon, SiteEyeOffIcon } from '@/lib/site-config';
import type { QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionViewModel } from './question-ui-types';

type QuestionDetailProps = {
  locale: string;
  question: QuestionViewModel;
  answerOptions: QuestionAnswerOptionDraft[];
  previewAsPlayer?: boolean;
  onTogglePreviewMode?: () => void;
};

export function QuestionDetail({
  locale,
  question,
  answerOptions,
  previewAsPlayer = false,
  onTogglePreviewMode,
}: QuestionDetailProps) {
  const isZh = locale === 'zh';
  const options = answerOptions.filter((option) => option.text.trim());
  const metaPillClassName =
    cn(
      'inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold transition',
      themeBgColor,
      themeIconColor
    );

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className={metaPillClassName}>{question.category}</span>
          <span className={metaPillClassName}>{question.subCategory ?? '--'}</span>
          <span className={metaPillClassName}>{question.difficulty}</span>
        </div>
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 text-2xl font-semibold text-slate-900 dark:text-white">{question.question}</h2>
          <button
            type="button"
            onClick={onTogglePreviewMode}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
            aria-pressed={previewAsPlayer}
            aria-label={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
          >
            {previewAsPlayer ? <SiteEyeOffIcon className="h-4 w-4" /> : <SiteEyeIcon className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isZh ? '这是题目主体展示区，后续会由详情 API 提供真实数据。' : 'This is the main question view. Real detail data will be connected in the next step.'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {isZh ? '选项' : 'Options'}
        </div>
        <div className="grid gap-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200',
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
                  'min-w-0 flex-1',
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
            {isZh ? '题目说明' : 'Explanation'}
          </div>
          <div className="rounded-2xl border border-black/10 px-4 py-4 text-sm leading-7 text-slate-700 dark:border-white/10 dark:text-slate-200">
            {question.explanation}
          </div>
        </div>
      ) : null}

      {question.questionImageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10">
          <Image
            src={question.questionImageUrl}
            alt={question.question}
            width={420}
            height={236}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 420px"
          />
        </div>
      ) : null}

      {!previewAsPlayer && question.tags.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isZh ? '标签' : 'Tags'}
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
