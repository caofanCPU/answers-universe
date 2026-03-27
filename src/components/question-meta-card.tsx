import type { QuestionViewModel } from './question-ui-types';

type QuestionMetaCardProps = {
  locale: string;
  question: QuestionViewModel;
};

export function QuestionMetaCard({ locale, question }: QuestionMetaCardProps) {
  const isZh = locale === 'zh';
  const rows = [
    { label: isZh ? '主分类' : 'Category', value: question.category },
    { label: isZh ? '次分类' : 'Sub Category', value: question.subCategory },
    { label: isZh ? '难度' : 'Difficulty', value: question.difficulty },
    { label: isZh ? '首发标记' : 'First Release', value: question.isFirst ? (isZh ? '是' : 'Yes') : isZh ? '否' : 'No' },
    { label: isZh ? '创建时间' : 'Created At', value: question.createdAt ?? '--' },
    { label: isZh ? '更新时间' : 'Updated At', value: question.updatedAt ?? '--' },
  ];

  return (
    <aside className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-950">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isZh ? '题目元信息' : 'Question Meta'}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isZh ? '详情页右侧用于承载分类、标签和状态信息。' : 'The right rail holds category, tags and record state.'}
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {row.label}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{row.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {question.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </aside>
  );
}
