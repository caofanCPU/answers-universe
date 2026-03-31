'use client';

import Link from 'next/link';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';
import { saveQuestionGroupContext } from './question-group-context';
import type { QuestionListItemDto } from '@/server/questions/types';

type QuestionListProps = {
  locale: string;
  items: QuestionListItemDto[];
};

export function QuestionList({ locale, items }: QuestionListProps) {
  const isZh = locale === 'zh';
  const groupIds = items.map((item) => item.id);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        {isZh ? '当前筛选条件下暂无题目。' : 'No questions match the current filters.'}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-3xl border border-black/10 p-5 dark:border-white/10"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.category}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.subCategory}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.difficulty}</span>
                {item.asFirst ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {isZh ? '首发' : 'First'}
                  </span>
                ) : null}
              </div>
              <h2
                className="overflow-hidden text-lg font-semibold text-slate-900 [-webkit-box-orient:vertical] [-webkit-line-clamp:4] [display:-webkit-box] dark:text-white md:min-h-[3.5rem] md:[-webkit-line-clamp:2]"
              >
                {item.question}
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Link
                href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}`)}
                onClick={() => saveQuestionGroupContext({ groupIds })}
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {isZh ? '查看' : 'View'}
              </Link>
              <span onClickCapture={() => saveQuestionGroupContext({ groupIds })}>
                <GradientButton
                  href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}/edit`)}
                  openInNewTab={false}
                  title={isZh ? '编辑' : 'Edit'}
                  align="center"
                  className="sm:w-auto"
                />
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
