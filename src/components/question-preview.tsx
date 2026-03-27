import { QuestionDetail } from './question-detail';
import { QuestionMetaCard } from './question-meta-card';
import type { QuestionViewModel } from './question-ui-types';

type QuestionPreviewProps = {
  locale: string;
  question: QuestionViewModel;
};

export function QuestionPreview({ locale, question }: QuestionPreviewProps) {
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-dashed border-purple-300/60 bg-linear-to-r from-purple-50 to-pink-50 px-4 py-3 text-sm text-slate-700 dark:border-purple-400/30 dark:from-purple-500/10 dark:to-pink-500/10 dark:text-slate-200">
        {locale === 'zh'
          ? '实时预览会复用详情展示组件，避免后续新建、编辑和详情页三套 UI 分叉。'
          : 'Live preview reuses the detail presentation component so create, edit and detail stay visually aligned.'}
      </div>
      <QuestionDetail locale={locale} question={question} />
      <QuestionMetaCard locale={locale} question={question} />
    </div>
  );
}
