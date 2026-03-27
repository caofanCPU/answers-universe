'use client';

import { useState } from 'react';
import type { QuestionViewModel } from './question-ui-types';

type QuestionAnswerPanelProps = {
  locale: string;
  question: QuestionViewModel;
};

export function QuestionAnswerPanel({ locale, question }: QuestionAnswerPanelProps) {
  const isZh = locale === 'zh';
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowAnswer((value) => !value)}
          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110"
        >
          {showAnswer ? (isZh ? '收起答案' : 'Hide Answer') : isZh ? '查看答案' : 'Show Answer'}
        </button>
        <button
          type="button"
          onClick={() => setShowExplanation((value) => !value)}
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
        >
          {showExplanation
            ? isZh
              ? '收起解析'
              : 'Hide Explanation'
            : isZh
              ? '查看解析'
              : 'Show Explanation'}
        </button>
      </div>
      {showAnswer ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm dark:bg-emerald-500/10">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            {isZh ? '正确答案' : 'Correct Answer'}
          </div>
          <div className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
            {question.correctAnswer}
          </div>
        </div>
      ) : null}
      {showExplanation ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isZh ? '题目解析' : 'Explanation'}
          </div>
          <div className="mt-2 leading-7">{question.explanation}</div>
        </div>
      ) : null}
    </div>
  );
}
