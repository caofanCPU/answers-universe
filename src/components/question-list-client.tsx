'use client';

import { useEffect, useMemo, useState } from 'react';
import { QuestionList } from './question-list';
import { QuestionListFilters } from './question-list-filters';
import type { QuestionListItemDto, QuestionListResult } from '@/server/questions/types';

type QuestionListClientProps = {
  locale: string;
  copy: {
    filters: {
      categoryLabel: string;
      categoryAll: string;
      subCategoryLabel: string;
      subCategoryAll: string;
      difficultyLabel: string;
      difficultyAll: string;
    };
    loading: string;
    loadFailed: string;
    pagination: {
      summary: string;
      previous: string;
      next: string;
    };
  };
};

type ListState = {
  items: QuestionListItemDto[];
  pagination: QuestionListResult['pagination'];
  loading: boolean;
  error: string | null;
};

function buildQuery(params: {
  page: number;
  category: string;
  subCategory: string;
  difficulty: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.category.trim()) searchParams.set('category', params.category.trim());
  if (params.subCategory.trim()) searchParams.set('subCategory', params.subCategory.trim());
  if (params.difficulty.trim()) searchParams.set('difficulty', params.difficulty.trim());
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', '20');
  return searchParams.toString();
}

export function QuestionListClient({ locale, copy }: QuestionListClientProps) {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState<ListState>({
    items: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    },
    loading: true,
    error: null,
  });

  const queryString = useMemo(
    () => buildQuery({ page, category, subCategory, difficulty }),
    [page, category, subCategory, difficulty]
  );

  useEffect(() => {
    setPage(1);
  }, [category, subCategory, difficulty]);

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

        const data = (await response.json()) as QuestionListResult;
        setState({
          items: data.items ?? [],
          pagination: data.pagination ?? {
            page: 1,
            pageSize: 20,
            total: data.items?.length ?? 0,
            totalPages: 1,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          items: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          },
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    void run();

    return () => controller.abort();
  }, [queryString]);

  return (
    <div className="space-y-6">
      <QuestionListFilters
        category={category}
        subCategory={subCategory}
        difficulty={difficulty}
        copy={copy.filters}
        onCategoryChange={setCategory}
        onSubCategoryChange={setSubCategory}
        onDifficultyChange={setDifficulty}
      />

      {state.loading ? (
        <div className="rounded-3xl border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          {copy.loading}
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          {copy.loadFailed}
          {state.error}
        </div>
      ) : null}

      {!state.loading && !state.error ? <QuestionList locale={locale} items={state.items} /> : null}

      {!state.loading && !state.error ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-black/10 px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={state.pagination.page <= 1}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {copy.pagination.previous}
            </button>
            <div className="min-w-28 text-center font-medium text-slate-600 dark:text-slate-300">
              {copy.pagination.summary
                .replace('{page}', String(state.pagination.page))
                .replace('{totalPages}', String(Math.max(state.pagination.totalPages, 1)))
                .replace('{total}', String(state.pagination.total))}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(state.pagination.totalPages || 1, current + 1))}
              disabled={state.pagination.totalPages <= 1 || state.pagination.page >= state.pagination.totalPages}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {copy.pagination.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
