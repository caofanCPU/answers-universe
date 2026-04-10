import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { SiteEyeIcon, SiteEyeOffIcon } from '@/lib/site-config';
import type { QuestionPreviewCopy } from './question-copy';
import { QuestionDetail } from './question-detail';
import type { QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionViewModel } from './question-ui-types';

type QuestionPreviewProps = {
  locale?: string;
  question: QuestionViewModel;
  answerOptions: QuestionAnswerOptionDraft[];
  copy?: QuestionPreviewCopy;
  previewAsPlayer: boolean;
  submitLabel: string;
  submitDisabled: boolean;
  onSubmit: () => void;
  onOpenDialog: () => void;
  onTogglePreviewMode: () => void;
};

export function QuestionPreview({
  locale: _locale,
  question,
  answerOptions,
  copy = {
    firstBadge: 'First',
    previewDescription: 'This is the full preview for the current question.',
    options: 'Options',
    explanation: 'Explanation',
    tags: 'Tags',
    showFullPreview: 'Show full preview',
    switchToPlayerView: 'Switch to player view',
    openPreview: 'Open preview',
  },
  previewAsPlayer,
  submitLabel,
  submitDisabled,
  onSubmit,
  onOpenDialog,
  onTogglePreviewMode,
}: QuestionPreviewProps) {
  return (
    <div className="grid gap-6">
      <QuestionDetail
        question={question}
        answerOptions={answerOptions}
        copy={copy}
        previewAsPlayer={previewAsPlayer}
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onTogglePreviewMode}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
          aria-pressed={previewAsPlayer}
          aria-label={previewAsPlayer ? copy.showFullPreview : copy.switchToPlayerView}
        >
          {previewAsPlayer ? <SiteEyeOffIcon className="h-4 w-4" /> : <SiteEyeIcon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onOpenDialog}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label={copy.openPreview}
        >
          <icons.QrCode className="h-4 w-4" />
        </button>
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
