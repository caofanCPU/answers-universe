'use client';

import { useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';
import { XButton } from '@windrun-huaiin/third-ui/main';
import type { QuestionListItemCopy } from './question-copy';
import { saveQuestionGroupContext } from './question-group-context';
import type { QuestionListItemDto } from '@/server/questions/types';

type QuestionListProps = {
  locale: string;
  items: QuestionListItemDto[];
  copy: QuestionListItemCopy;
  onDeleted: () => void;
};

export function QuestionList({ locale, items, copy, onDeleted }: QuestionListProps) {
  const groupIds = items.map((item) => item.id);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
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

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setConfirmingId(null);
      onDeleted();
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
        <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        {copy.empty}
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
            aria-label={copy.copyId}
            title={copy.copyId}
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
                  aria-label={copy.copyUuid}
                  title={copy.copyUuid}
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
                    {copy.firstBadge}
                  </span>
                ) : null}
              </div>
              <h2
                className="overflow-hidden text-base font-semibold leading-6 text-slate-900 [-webkit-box-orient:vertical] [-webkit-line-clamp:4] [display:-webkit-box] dark:text-white md:min-h-12 md:[-webkit-line-clamp:2]"
              >
                {item.question}
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <icons.CheckLine className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <span>{item.correctAnswer}</span>
              </div>
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
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-20"
                className="px-3 py-1.5 text-xs text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-400/20 dark:hover:bg-red-500/10"
                loadingText={copy.deleteLoading}
                button={{
                  icon: false,
                  text: copy.delete,
                  onClick: () => setConfirmingId(item.id),
                  disabled: deletingId === item.id,
                }}
              />
              <span onClickCapture={() => saveQuestionGroupContext({ groupIds })}>
                <GradientButton
                  href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}`)}
                  openInNewTab={false}
                  title={copy.view}
                  align="center"
                  variant="subtle"
                  icon={false}
                  className="min-h-8 min-w-20 px-3 py-1.5 text-xs font-semibold shadow-none hover:shadow-none"
                />
              </span>
              <span onClickCapture={() => saveQuestionGroupContext({ groupIds })}>
                <GradientButton
                  href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}/edit`)}
                  openInNewTab={false}
                  title={copy.edit}
                  align="center"
                  icon={false}
                  className="min-h-8 px-3 py-1.5 text-xs min-w-20"
                />
              </span>
            </div>
          </div>
          {confirmingId === item.id ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-4 dark:border-red-400/20 dark:bg-red-500/10">
              <div className="text-sm font-semibold text-red-700 dark:text-red-200">
                {copy.confirmDeleteTitle}
              </div>
              <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                {copy.confirmDeleteDescription}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <XButton
                  type="single"
                  variant="subtle"
                  minWidth="min-w-0"
                  className="px-3 py-1.5 text-xs"
                  button={{
                    icon: false,
                    text: copy.cancel,
                    onClick: () => setConfirmingId(null),
                    disabled: deletingId === item.id,
                  }}
                />
                <XButton
                  type="single"
                  variant="subtle"
                  minWidth="min-w-0"
                  className="px-3 py-1.5 text-xs text-red-700 border-red-200 hover:border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-400/20 dark:hover:bg-red-500/20"
                  loadingText={copy.deleteLoading}
                  button={{
                    icon: false,
                    text: copy.confirmDelete,
                    onClick: () => void handleDelete(item.id),
                    disabled: deletingId === item.id,
                  }}
                />
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
