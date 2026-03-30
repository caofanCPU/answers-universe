import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { SiteEyeIcon, SiteEyeOffIcon } from '@/lib/site-config';
import { QuestionDetail } from './question-detail';
import type { QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionViewModel } from './question-ui-types';

type QuestionPreviewProps = {
  locale: string;
  question: QuestionViewModel;
  answerOptions: QuestionAnswerOptionDraft[];
  previewAsPlayer: boolean;
  submitLabel: string;
  submitDisabled: boolean;
  onSubmit: () => void;
  onOpenDialog: () => void;
  onTogglePreviewMode: () => void;
};

export function QuestionPreview({
  locale,
  question,
  answerOptions,
  previewAsPlayer,
  submitLabel,
  submitDisabled,
  onSubmit,
  onOpenDialog,
  onTogglePreviewMode,
}: QuestionPreviewProps) {
  const isZh = locale === 'zh';

  return (
    <div className="grid gap-6">
      <QuestionDetail
        locale={locale}
        question={question}
        answerOptions={answerOptions}
        previewAsPlayer={previewAsPlayer}
        bottomActions={(
          <>
            <button
              type="button"
              onClick={onTogglePreviewMode}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
              aria-pressed={previewAsPlayer}
              aria-label={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
            >
              {previewAsPlayer ? <SiteEyeOffIcon className="h-4 w-4" /> : <SiteEyeIcon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onOpenDialog}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
              aria-label={isZh ? '放大预览' : 'Open preview'}
            >
              <icons.QrCode className="h-4 w-4" />
            </button>
          </>
        )}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
