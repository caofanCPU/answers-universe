'use client';

type QuestionListFiltersProps = {
  locale: string;
  keyword: string;
  category: string;
  difficulty: string;
  tags: string;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onTagsChange: (value: string) => void;
};

export function QuestionListFilters(props: QuestionListFiltersProps) {
  const {
    locale,
    keyword,
    category,
    difficulty,
    tags,
    onKeywordChange,
    onCategoryChange,
    onDifficultyChange,
    onTagsChange,
  } = props;

  const isZh = locale === 'zh';

  return (
    <div className="grid gap-4 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-slate-950 md:grid-cols-4">
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '关键词' : 'Keyword'}
        </span>
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={isZh ? '搜索题干' : 'Search question text'}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '主分类' : 'Category'}
        </span>
        <input
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          placeholder={isZh ? '例如 Hardware' : 'Example: Hardware'}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '难度' : 'Difficulty'}
        </span>
        <input
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value)}
          placeholder={isZh ? '例如 Easy' : 'Example: Easy'}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isZh ? '标签' : 'Tags'}
        </span>
        <input
          value={tags}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder={isZh ? '逗号分隔' : 'Comma separated'}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        />
      </label>
    </div>
  );
}
