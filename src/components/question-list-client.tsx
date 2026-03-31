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
      idLabel: string;
      idPlaceholder: string;
      uuidLabel: string;
      uuidPlaceholder: string;
      firstLabel: string;
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

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function buildQuery(params: {
  page: number;
  id: string;
  uuid: string;
  asFirst: boolean;
  category: string;
  subCategory: string;
  difficulty: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.id.trim()) searchParams.set('id', params.id.trim());
  if (params.uuid.trim()) searchParams.set('uuid', params.uuid.trim());
  if (params.asFirst) searchParams.set('asFirst', 'true');
  if (params.category.trim()) searchParams.set('category', params.category.trim());
  if (params.subCategory.trim()) searchParams.set('subCategory', params.subCategory.trim());
  if (params.difficulty.trim()) searchParams.set('difficulty', params.difficulty.trim());
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', '20');
  return searchParams.toString();
}

export function QuestionListClient({ locale, copy }: QuestionListClientProps) {
  const [id, setId] = useState('');
  const [uuid, setUuid] = useState('');
  const [asFirst, setAsFirst] = useState(false);
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
    () => buildQuery({ page, id, uuid, asFirst, category, subCategory, difficulty }),
    [page, id, uuid, asFirst, category, subCategory, difficulty]
  );
  const normalizedUuid = uuid.trim().toLowerCase();
  const hasInvalidUuid = normalizedUuid.length > 0 && !isValidUuid(normalizedUuid);

  useEffect(() => {
    setPage(1);
  }, [id, uuid, asFirst, category, subCategory, difficulty]);

  useEffect(() => {
    if (hasInvalidUuid) {
      setState({
        items: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
        loading: false,
        error: null,
      });
      return;
    }

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

        if (response.status === 400) {
          setState({
            items: [],
            pagination: {
              page: 1,
              pageSize: 20,
              total: 0,
              totalPages: 0,
            },
            loading: false,
            error: null,
          });
          return;
        }

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
  }, [hasInvalidUuid, queryString]);

  return (
    <div className="space-y-4">
      <div className="mb-4 sm:mb-5">
        <QuestionListFilters
          id={id}
          uuid={uuid}
          uuidInvalid={hasInvalidUuid}
          asFirst={asFirst}
          category={category}
          subCategory={subCategory}
          difficulty={difficulty}
          copy={copy.filters}
          onIdChange={setId}
          onUuidChange={setUuid}
          onAsFirstChange={setAsFirst}
          onCategoryChange={setCategory}
          onSubCategoryChange={setSubCategory}
          onDifficultyChange={setDifficulty}
        />
      </div>

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
        <div className="flex items-center justify-center rounded-3xl border border-black/10 px-3 py-2.5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300 sm:px-4 sm:text-sm">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={state.pagination.page <= 1}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-3 py-1.5 font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {copy.pagination.previous}
            </button>
            <div className="min-w-24 text-center font-medium text-slate-600 dark:text-slate-300 sm:min-w-28">
              {copy.pagination.summary
                .replace('{page}', String(state.pagination.page))
                .replace('{totalPages}', String(Math.max(state.pagination.totalPages, 1)))
                .replace('{total}', String(state.pagination.total))}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(state.pagination.totalPages || 1, current + 1))}
              disabled={state.pagination.totalPages <= 1 || state.pagination.page >= state.pagination.totalPages}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-3 py-1.5 font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {copy.pagination.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
