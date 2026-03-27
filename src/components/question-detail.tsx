import type { QuestionViewModel } from './question-ui-types';
import { QuestionAnswerPanel } from './question-answer-panel';

type QuestionDetailProps = {
  locale: string;
  question: QuestionViewModel;
};

export function QuestionDetail({ locale, question }: QuestionDetailProps) {
  const isZh = locale === 'zh';
  const options = [question.correctAnswer, ...question.incorrectAnswers];

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{question.category}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{question.subCategory}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{question.difficulty}</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{question.question}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isZh ? '这是题目主体展示区，后续会由详情 API 提供真实数据。' : 'This is the main question view. Real detail data will be connected in the next step.'}
        </p>
      </div>

      {question.questionImageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          {question.questionImageUrl}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {isZh ? '选项' : 'Options'}
        </div>
        <div className="grid gap-3">
          {options.map((option, index) => (
            <div
              key={`${question.id}-${option}-${index}`}
              className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <span className="mr-3 font-semibold text-slate-500 dark:text-slate-400">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </div>
          ))}
        </div>
      </div>

      <QuestionAnswerPanel locale={locale} question={question} />
    </div>
  );
}
