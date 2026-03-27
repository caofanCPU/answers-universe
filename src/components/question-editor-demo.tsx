'use client';

import { useState } from 'react';
import { QuestionForm } from './question-form';
import { QuestionPreview } from './question-preview';
import { questionMockFormValues } from './question-mock-data';
import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

type QuestionEditorDemoProps = {
  locale: string;
  mode: 'create' | 'edit';
};

function toQuestionViewModel(values: QuestionFormValues): QuestionViewModel {
  const incorrectAnswers = values.incorrectAnswersText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  const tags = values.tagsText
    .split(/[,，|]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const questionImageUrl =
    values.questionImage && values.cdnImagePrefix
      ? `${values.cdnImagePrefix.replace(/\/$/, '')}/${values.questionImage.replace(/^\//, '')}`
      : values.questionImage || null;

  return {
    id: values.question ? 'draft' : '--',
    question: values.question,
    cdnImagePrefix: values.cdnImagePrefix,
    questionImage: values.questionImage,
    questionImageUrl,
    correctAnswer: values.correctAnswer,
    incorrectAnswers,
    explanation: values.explanation,
    difficulty: values.difficulty,
    category: values.category,
    subCategory: values.subCategory,
    tags,
    isFirst: values.isFirst,
    createdAt: null,
    updatedAt: null,
  };
}

export function QuestionEditorDemo({ locale, mode }: QuestionEditorDemoProps) {
  const [values, setValues] = useState<QuestionFormValues>(
    mode === 'edit'
      ? questionMockFormValues
      : {
          question: '',
          cdnImagePrefix: '',
          questionImage: '',
          correctAnswer: '',
          incorrectAnswersText: '',
          explanation: '',
          difficulty: '',
          category: '',
          subCategory: '',
          tagsText: '',
          isFirst: false,
        }
  );

  const previewQuestion = toQuestionViewModel(values);
  const isZh = locale === 'zh';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-dashed border-purple-300/60 bg-linear-to-r from-purple-50 to-pink-50 px-4 py-3 text-sm text-slate-700 dark:border-purple-400/30 dark:from-purple-500/10 dark:to-pink-500/10 dark:text-slate-200">
          {isZh
            ? '这一批先把表单和预览组件落下来，提交和回填会在下一批接 API。'
            : 'This batch focuses on form and preview components first. Submission and data loading will be wired in the next batch.'}
        </div>
        <QuestionForm locale={locale} values={values} onChange={setValues} />
      </div>
      <QuestionPreview locale={locale} question={previewQuestion} />
    </div>
  );
}
