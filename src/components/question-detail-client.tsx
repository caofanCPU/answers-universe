'use client';

import { useEffect, useState } from 'react';
import { QuestionDetail } from './question-detail';
import type { QuestionDetailDto } from '@/server/questions/types';

type QuestionDetailClientProps = {
  locale: string;
  id: string;
};

type DetailState = {
  item: QuestionDetailDto | null;
  loading: boolean;
  error: string | null;
};

export function QuestionDetailClient({ locale, id }: QuestionDetailClientProps) {
  const [state, setState] = useState<DetailState>({
    item: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setState({ item: null, loading: true, error: null });
      try {
        const response = await fetch(`/api/questions/${id}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (response.status === 404) {
          setState({ item: null, loading: false, error: 'NOT_FOUND' });
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as QuestionDetailDto;
        setState({ item: data, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          item: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    void run();

    return () => controller.abort();
  }, [id]);

  const isZh = locale === 'zh';

  if (state.loading) {
    return (
      <div className="rounded-3xl border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        {isZh ? '正在加载题目详情...' : 'Loading question detail...'}
      </div>
    );
  }

  if (state.error) {
    const text =
      state.error === 'NOT_FOUND'
        ? isZh
          ? '未找到对应题目。'
          : 'Question not found.'
        : `${isZh ? '详情加载失败：' : 'Failed to load question detail: '}${state.error}`;

    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
        {text}
      </div>
    );
  }

  if (!state.item) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <QuestionDetail locale={locale} question={state.item} />
    </div>
  );
}
