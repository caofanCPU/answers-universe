'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);

    if (copyResetTimerRef.current) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopiedField(null);
      copyResetTimerRef.current = null;
    }, 1400);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        {isZh ? '当前筛选条件下暂无题目。' : 'No questions match the current filters.'}
      </div>
    );
  }

  return (
    <div className="grid gap-5 pt-1 sm:gap-6 sm:pt-1">
      {items.map((item) => (
        <article
          key={item.id}
          className="relative rounded-3xl border border-black/10 px-4 pb-3.5 pt-5 dark:border-white/10 sm:px-4.5 sm:pt-5.5 md:pt-3.5"
        >
          <button
            type="button"
            onClick={() => void copyText(`id-${item.id}`, item.id)}
            className="absolute left-1/2 top-0 inline-flex max-w-[72%] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={isZh ? '复制题目 ID' : 'Copy question ID'}
            title={isZh ? '复制题目 ID' : 'Copy question ID'}
          >
            <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">ID</span>
            <span className="truncate font-mono text-[11px] text-slate-800 dark:text-slate-100">{item.id}</span>
            <span className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-slate-400 dark:text-slate-500">
              {copiedField === `id-${item.id}` ? <icons.X className="h-3 w-3" /> : <icons.Copy className="h-3 w-3" />}
            </span>
          </button>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyText(`uuid-${item.id}`, item.uuid)}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label={isZh ? '复制题目 UUID' : 'Copy question UUID'}
                  title={isZh ? '复制题目 UUID' : 'Copy question UUID'}
                >
                  <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">UUID</span>
                  <span className="truncate font-mono text-[11px] text-slate-800 dark:text-slate-100">{item.uuid}</span>
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 dark:text-slate-500">
                    {copiedField === `uuid-${item.id}` ? <icons.X className="h-3 w-3" /> : <icons.Copy className="h-3 w-3" />}
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 dark:bg-white/5">{item.category}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 dark:bg-white/5">{item.subCategory}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 dark:bg-white/5">{item.difficulty}</span>
                {item.asFirst ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {isZh ? '首发' : 'First'}
                  </span>
                ) : null}
              </div>
              <h2
                className="overflow-hidden text-base font-semibold leading-6 text-slate-900 [-webkit-box-orient:vertical] [-webkit-line-clamp:4] [display:-webkit-box] dark:text-white md:min-h-12 md:[-webkit-line-clamp:2]"
              >
                {item.question}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="rounded-full border border-black/10 px-2.5 py-0.5 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 md:shrink-0">
              <Link
                href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}`)}
                onClick={() => saveQuestionGroupContext({ groupIds })}
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {isZh ? '查看' : 'View'}
              </Link>
              <span onClickCapture={() => saveQuestionGroupContext({ groupIds })}>
                <GradientButton
                  href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}/edit`)}
                  openInNewTab={false}
                  title={isZh ? '编辑' : 'Edit'}
                  align="center"
                  className="min-h-8 px-3 py-1.5 text-xs sm:w-auto"
                />
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
