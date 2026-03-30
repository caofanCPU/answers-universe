'use client';

import { useEffect, useMemo, useState } from 'react';
import { QuestionList } from './question-list';
import { QuestionListFilters } from './question-list-filters';
import type { QuestionListItemDto } from '@/server/questions/types';

type QuestionListClientProps = {
  locale: string;
};

type ListState = {
  items: QuestionListItemDto[];
  loading: boolean;
  error: string | null;
};

function buildQuery(params: {
  category: string;
  subCategory: string;
  difficulty: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.category.trim()) searchParams.set('category', params.category.trim());
  if (params.subCategory.trim()) searchParams.set('subCategory', params.subCategory.trim());
  if (params.difficulty.trim()) searchParams.set('difficulty', params.difficulty.trim());
  searchParams.set('page', '1');
  searchParams.set('pageSize', '20');
  return searchParams.toString();
}

export function QuestionListClient({ locale }: QuestionListClientProps) {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [state, setState] = useState<ListState>({
    items: [],
    loading: true,
    error: null,
  });

  const queryString = useMemo(
    () => buildQuery({ category, subCategory, difficulty }),
    [category, subCategory, difficulty]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(`/api/questions?${queryString}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as { items: QuestionListItemDto[] };
        setState({
          items: data.items ?? [],
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          items: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    void run();

    return () => controller.abort();
  }, [queryString]);

  const isZh = locale === 'zh';

  return (
    <div className="space-y-6">
      <QuestionListFilters
        locale={locale}
        category={category}
        subCategory={subCategory}
        difficulty={difficulty}
        onCategoryChange={setCategory}
        onSubCategoryChange={setSubCategory}
        onDifficultyChange={setDifficulty}
      />

      {state.loading ? (
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
          {isZh ? '正在加载题目列表...' : 'Loading questions...'}
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          {isZh ? '列表加载失败：' : 'Failed to load questions: '}
          {state.error}
        </div>
      ) : null}

      {!state.loading && !state.error ? <QuestionList locale={locale} items={state.items} /> : null}
    </div>
  );
}
