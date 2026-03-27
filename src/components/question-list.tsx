import Link from 'next/link';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import type { QuestionListItemDto } from '@/server/questions/types';

type QuestionListProps = {
  locale: string;
  items: QuestionListItemDto[];
};

export function QuestionList({ locale, items }: QuestionListProps) {
  const isZh = locale === 'zh';

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
        {isZh ? '当前筛选条件下暂无题目。' : 'No questions match the current filters.'}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.category}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.subCategory}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{item.difficulty}</span>
                {item.isFirst ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {isZh ? '首发' : 'First'}
                  </span>
                ) : null}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{item.question}</h2>
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
            <div className="flex gap-3">
              <Link
                href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}`)}
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {isZh ? '查看' : 'View'}
              </Link>
              <Link
                href={getAsNeededLocalizedUrl(locale, `/questions/${item.id}/edit`)}
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110"
              >
                {isZh ? '编辑' : 'Edit'}
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
