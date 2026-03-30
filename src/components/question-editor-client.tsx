'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionForm } from './question-form';
import { QuestionPreview } from './question-preview';
import type { QuestionDetailDto, QuestionUpsertInput } from '@/server/questions/types';
import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

type QuestionEditorClientProps = {
  locale: string;
  mode: 'create' | 'edit';
  id?: string;
  copy: {
    noticeCreate: string;
    noticeEdit: string;
    loading: string;
    submitFailed: string;
    saving: string;
    createButton: string;
    updateButton: string;
    form: {
      question: string;
      categoryLabel: string;
      categoryEmpty: string;
      subCategoryLabel: string;
      subCategoryEmpty: string;
      difficultyLabel: string;
      difficultyEmpty: string;
      tagsLabel: string;
      tagsPlaceholder: string;
      tagsEmpty: string;
      correctAnswer: string;
      incorrectAnswersLabel: string;
      incorrectAnswersPlaceholder: string;
      explanation: string;
      cdnImagePrefix: string;
      questionImage: string;
      isFirst: string;
    };
  };
};

function emptyFormValues(): QuestionFormValues {
  return {
    question: '',
    cdnImagePrefix: '',
    questionImage: '',
    correctAnswer: '',
    incorrectAnswersText: '',
    explanation: '',
    difficulty: '',
    category: '',
    subCategory: '',
    tags: [],
    isFirst: false,
  };
}

function detailToFormValues(detail: QuestionDetailDto): QuestionFormValues {
  return {
    question: detail.question,
    cdnImagePrefix: detail.cdnImagePrefix ?? '',
    questionImage: detail.questionImage ?? '',
    correctAnswer: detail.correctAnswer,
    incorrectAnswersText: detail.incorrectAnswers.join('\n'),
    explanation: detail.explanation,
    difficulty: detail.difficulty,
    category: detail.category,
    subCategory: detail.subCategory,
    tags: detail.tags,
    isFirst: detail.isFirst,
  };
}

function formValuesToPayload(values: QuestionFormValues): QuestionUpsertInput {
  return {
    question: values.question.trim(),
    cdnImagePrefix: values.cdnImagePrefix.trim() || null,
    questionImage: values.questionImage.trim() || null,
    correctAnswer: values.correctAnswer.trim(),
    incorrectAnswers: values.incorrectAnswersText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    explanation: values.explanation.trim(),
    difficulty: values.difficulty.trim(),
    category: values.category.trim(),
    subCategory: values.subCategory.trim(),
    tags: values.tags,
    isFirst: values.isFirst,
  };
}

function formValuesToPreview(values: QuestionFormValues): QuestionViewModel {
  const payload = formValuesToPayload(values);
  const questionImageUrl =
    payload.questionImage && payload.cdnImagePrefix
      ? `${payload.cdnImagePrefix.replace(/\/$/, '')}/${payload.questionImage.replace(/^\//, '')}`
      : payload.questionImage ?? null;

  return {
    id: 'draft',
    question: payload.question || '--',
    cdnImagePrefix: payload.cdnImagePrefix ?? null,
    questionImage: payload.questionImage ?? null,
    questionImageUrl,
    correctAnswer: payload.correctAnswer || '--',
    incorrectAnswers: payload.incorrectAnswers,
    explanation: payload.explanation || '--',
    difficulty: payload.difficulty || '--',
    category: payload.category || '--',
    subCategory: payload.subCategory || '--',
    tags: payload.tags ?? [],
    isFirst: payload.isFirst ?? false,
    createdAt: null,
    updatedAt: null,
  };
}

export function QuestionEditorClient({ locale, mode, id, copy }: QuestionEditorClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<QuestionFormValues>(emptyFormValues());
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !id) {
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/questions/${id}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as QuestionDetailDto;
        setValues(detailToFormValues(data));
        setLoading(false);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    }

    void loadDetail();

    return () => controller.abort();
  }, [id, mode]);

  const previewQuestion = useMemo(() => formValuesToPreview(values), [values]);
  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = formValuesToPayload(values);
      const url = mode === 'create' ? '/api/questions' : `/api/questions/${id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionDetailDto;
      router.push(getAsNeededLocalizedUrl(locale, `/questions/${data.id}`));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-dashed border-purple-300/60 bg-linear-to-r from-purple-50 to-pink-50 px-4 py-3 text-sm text-slate-700 dark:border-purple-400/30 dark:from-purple-500/10 dark:to-pink-500/10 dark:text-slate-200">
          {mode === 'create' ? copy.noticeCreate : copy.noticeEdit}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-black/10 bg-white px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
            {copy.loading}
          </div>
        ) : (
          <>
            <QuestionForm values={values} onChange={setValues} copy={copy.form} />
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {copy.submitFailed}
                {error}
              </div>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? copy.saving : mode === 'create' ? copy.createButton : copy.updateButton}
              </button>
            </div>
          </>
        )}
      </div>
      <QuestionPreview locale={locale} question={previewQuestion} />
    </div>
  );
}
