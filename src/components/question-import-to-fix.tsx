'use client';

import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { XButton } from '@windrun-huaiin/third-ui/main';
import type { QuestionImportValidationItem } from '@/server/questions/types';
import { buildAnswerOptionDrafts, type QuestionAnswerOptionDraft } from './question-answer-options';
import { QuestionForm } from './question-form';
import type { QuestionFormValues } from './question-ui-types';

const CDN_IMAGE_PREFIX = process.env.NEXT_PUBLIC_STYLE_CDN_IMG_PREFIX?.trim() ?? '';

type QuestionImportToFixProps = {
  locale: string;
  item: QuestionImportValidationItem;
  index: number;
  total: number;
  revalidating: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onRemove: () => void;
  onRevalidate: () => void;
  onChange: (nextValues: QuestionFormValues) => void;
  onAnswerOptionsChange: (options: QuestionAnswerOptionDraft[]) => void;
};

function itemToFormValues(item: QuestionImportValidationItem): QuestionFormValues {
  return {
    question: item.question,
    cdnImagePrefix: CDN_IMAGE_PREFIX || item.cdnImagePrefix,
    questionImage: item.questionImage,
    correctAnswer: item.correctAnswer,
    incorrectAnswersText: item.incorrectAnswers.join('\n'),
    explanation: item.explanation,
    difficulty: item.difficulty,
    category: item.category,
    subCategory: item.subCategory ?? '',
    tags: item.tags,
    asFirst: item.asFirst,
  };
}

function buildImportFormCopy(isZh: boolean) {
  return {
    question: isZh ? '题目' : 'Question',
    answersLabel: isZh ? '答案选项' : 'Answer Options',
    answersPlaceholder: isZh ? '输入一个答案后按 Enter 新增' : 'Type one answer and press Enter',
    answersEmpty: isZh ? '暂无答案' : 'No answers yet',
    answersExpand: isZh ? '展开答案' : 'Expand answers',
    answersCollapse: isZh ? '收起答案' : 'Collapse answers',
    answersCorrectPrefix: isZh ? '正确答案' : 'Correct',
    answersNoCorrect: isZh ? '未设置正确答案' : 'No correct answer',
    categoryLabel: isZh ? '分类' : 'Category',
    categoryEmpty: isZh ? '请选择' : 'Select',
    subCategoryLabel: isZh ? '子分类' : 'Sub Category',
    subCategoryEmpty: isZh ? '请选择' : 'Select',
    difficultyLabel: isZh ? '难度' : 'Difficulty',
    difficultyEmpty: isZh ? '请选择' : 'Select',
    tagsLabel: isZh ? '标签' : 'Tags',
    tagsPlaceholder: isZh ? '输入后回车添加标签' : 'Type and press Enter',
    tagsEmpty: isZh ? '暂无标签' : 'No tags',
    explanation: isZh ? '解析' : 'Explanation',
    cdnImagePrefix: isZh ? 'CDN 前缀' : 'CDN Prefix',
    questionImage: isZh ? '题图' : 'Question Image',
    asFirst: 'Mark as first-release question',
  };
}

export function QuestionImportToFix({
  locale,
  item,
  index,
  total,
  revalidating,
  onPrevious,
  onNext,
  onRemove,
  onRevalidate,
  onChange,
  onAnswerOptionsChange,
}: QuestionImportToFixProps) {
  const isZh = locale === 'zh';
  const values = itemToFormValues(item);
  const answerOptions = buildAnswerOptionDrafts(item.correctAnswer, item.incorrectAnswers, item.correctAnswerIndex ?? 0);

  return (
    <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{isZh ? 'To Fix' : 'To Fix'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isZh ? `第 ${index + 1} / ${total} 条` : `${index + 1} / ${total}`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{item.importId}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={index === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <icons.ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <icons.ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <QuestionForm
          values={values}
          answerOptions={answerOptions}
          onAnswerOptionsChange={onAnswerOptionsChange}
          onChange={onChange}
          fieldErrors={item.fieldErrors}
          usb={buildImportFormCopy(isZh)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <XButton
          type="single"
          variant="subtle"
          minWidth="min-w-0"
          className="px-4 py-2.5"
          button={{
            icon: false,
            text: isZh ? '移除当前项' : 'Remove Current',
            onClick: onRemove,
          }}
        />
        <XButton
          type="single"
          variant="subtle"
          minWidth="min-w-0"
          className="px-4 py-2.5"
          loadingText={isZh ? '校验中...' : 'Loading...'}
          button={{
            icon: false,
            text: isZh ? '校验本条' : 'Validate Current',
            onClick: onRevalidate,
            disabled: revalidating,
          }}
        />
      </div>
    </div>
  );
}
