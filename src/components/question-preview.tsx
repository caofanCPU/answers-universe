import { QuestionDetail } from './question-detail';
import type { QuestionAnswerOptionDraft } from './question-answer-options';
import type { QuestionViewModel } from './question-ui-types';

type QuestionPreviewProps = {
  locale: string;
  question: QuestionViewModel;
  answerOptions: QuestionAnswerOptionDraft[];
  previewAsPlayer: boolean;
  onTogglePreviewMode: () => void;
};

export function QuestionPreview({
  locale,
  question,
  answerOptions,
  previewAsPlayer,
  onTogglePreviewMode,
}: QuestionPreviewProps) {
  return (
    <div className="grid gap-6">
      <QuestionDetail
        locale={locale}
        question={question}
        answerOptions={answerOptions}
        previewAsPlayer={previewAsPlayer}
        onTogglePreviewMode={onTogglePreviewMode}
      />
    </div>
  );
}
