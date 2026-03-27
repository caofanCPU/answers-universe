'use client';

import type { ChangeEvent } from 'react';
import type { QuestionFormValues } from './question-ui-types';

type QuestionFormProps = {
  locale: string;
  values: QuestionFormValues;
  onChange: (next: QuestionFormValues) => void;
};

function updateField(
  values: QuestionFormValues,
  onChange: (next: QuestionFormValues) => void,
  field: keyof QuestionFormValues,
  value: string | boolean
) {
  onChange({
    ...values,
    [field]: value,
  });
}

export function QuestionForm({ locale, values, onChange }: QuestionFormProps) {
  const isZh = locale === 'zh';

  const onInputChange =
    (field: keyof QuestionFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === 'isFirst'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      updateField(values, onChange, field, value);
    };

  return (
    <form className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '题干' : 'Question'}</span>
          <textarea
            value={values.question}
            onChange={onInputChange('question')}
            rows={4}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '主分类' : 'Category'}</span>
          <input
            value={values.category}
            onChange={onInputChange('category')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '次分类' : 'Sub Category'}</span>
          <input
            value={values.subCategory}
            onChange={onInputChange('subCategory')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '难度' : 'Difficulty'}</span>
          <input
            value={values.difficulty}
            onChange={onInputChange('difficulty')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '标签' : 'Tags'}</span>
          <input
            value={values.tagsText}
            onChange={onInputChange('tagsText')}
            placeholder={isZh ? '逗号分隔' : 'Comma separated'}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '正确答案' : 'Correct Answer'}</span>
          <input
            value={values.correctAnswer}
            onChange={onInputChange('correctAnswer')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '错误答案' : 'Incorrect Answers'}</span>
          <textarea
            value={values.incorrectAnswersText}
            onChange={onInputChange('incorrectAnswersText')}
            rows={4}
            placeholder={isZh ? '每行一个错误答案' : 'One incorrect answer per line'}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '解析' : 'Explanation'}</span>
          <textarea
            value={values.explanation}
            onChange={onInputChange('explanation')}
            rows={5}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '图片前缀' : 'CDN Prefix'}</span>
          <input
            value={values.cdnImagePrefix}
            onChange={onInputChange('cdnImagePrefix')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{isZh ? '图片路径' : 'Image Path'}</span>
          <input
            value={values.questionImage}
            onChange={onInputChange('questionImage')}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
        <input
          type="checkbox"
          checked={values.isFirst}
          onChange={onInputChange('isFirst')}
          className="h-4 w-4 rounded border-black/10"
        />
        <span>{isZh ? '是否首发题目' : 'Mark as first-release question'}</span>
      </label>
    </form>
  );
}
