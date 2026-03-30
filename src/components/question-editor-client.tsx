'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import {
  buildAnswerOptionDrafts,
  splitAnswerOptionDrafts,
  type QuestionAnswerOptionDraft,
} from './question-answer-options';
import { QuestionForm } from './question-form';
import { QuestionPreview } from './question-preview';
import type { QuestionDetailDto, QuestionUpsertInput } from '@/server/questions/types';
import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

const CDN_BASE_URL = process.env.NEXT_PUBLIC_STYLE_CDN_URL?.trim() ?? '';
const CDN_IMAGE_PREFIX = process.env.NEXT_PUBLIC_STYLE_CDN_IMG_PREFIX?.trim() ?? '';

type QuestionEditorClientProps = {
  locale: string;
  mode: 'create' | 'edit';
  id?: string;
  usb: {
    noticeCreate: string;
    noticeEdit: string;
    loading: string;
    submitFailed: string;
    saving: string;
    createButton: string;
    updateButton: string;
    form: {
      question: string;
      answersLabel: string;
      answersPlaceholder: string;
      answersEmpty: string;
      answersExpand: string;
      answersCollapse: string;
      answersCorrectPrefix: string;
      answersNoCorrect: string;
      categoryLabel: string;
      categoryEmpty: string;
      subCategoryLabel: string;
      subCategoryEmpty: string;
      difficultyLabel: string;
      difficultyEmpty: string;
      tagsLabel: string;
      tagsPlaceholder: string;
      tagsEmpty: string;
      explanation: string;
      cdnImagePrefix: string;
      questionImage: string;
      isFirst: string;
    };
  };
};

function normalizeQuestionImagePath(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.toLowerCase().endsWith('.webp') ? trimmed : `${trimmed}.webp`;
}

function resolveCdnImagePrefix(value?: string | null): string {
  return CDN_IMAGE_PREFIX || value?.trim() || '';
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function buildQuestionImageUrl(cdnImagePrefix: string | null, questionImage: string | null): string | null {
  if (!questionImage) {
    return null;
  }

  const path = trimSlashes(questionImage);
  if (!path) {
    return null;
  }

  const base = CDN_BASE_URL.replace(/\/+$/, '');
  const prefix = trimSlashes(cdnImagePrefix ?? '');

  if (!base) {
    return prefix ? `/${prefix}/${path}` : `/${path}`;
  }

  return prefix ? `${base}/${prefix}/${path}` : `${base}/${path}`;
}

function emptyFormValues(): QuestionFormValues {
  return {
    question: '',
    cdnImagePrefix: CDN_IMAGE_PREFIX,
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

function detailToAnswerOptions(detail: QuestionDetailDto): QuestionAnswerOptionDraft[] {
  return buildAnswerOptionDrafts(detail.correctAnswer, detail.incorrectAnswers);
}

function detailToFormValues(detail: QuestionDetailDto): QuestionFormValues {
  return {
    question: detail.question,
    cdnImagePrefix: resolveCdnImagePrefix(detail.cdnImagePrefix),
    questionImage: normalizeQuestionImagePath(detail.questionImage ?? ''),
    correctAnswer: detail.correctAnswer,
    incorrectAnswersText: detail.incorrectAnswers.join('\n'),
    explanation: detail.explanation,
    difficulty: detail.difficulty,
    category: detail.category,
    subCategory: detail.subCategory ?? '',
    tags: detail.tags,
    isFirst: detail.isFirst,
  };
}

function formValuesToPayload(
  values: QuestionFormValues,
  answerOptions: QuestionAnswerOptionDraft[]
): QuestionUpsertInput {
  const answers = splitAnswerOptionDrafts(answerOptions);

  return {
    question: values.question.trim(),
    cdnImagePrefix: resolveCdnImagePrefix(values.cdnImagePrefix) || null,
    questionImage: normalizeQuestionImagePath(values.questionImage) || null,
    correctAnswer: answers.correctAnswer.trim(),
    incorrectAnswers: answers.incorrectAnswers,
    explanation: values.explanation.trim(),
    difficulty: values.difficulty.trim(),
    category: values.category.trim(),
    subCategory: values.subCategory.trim(),
    tags: values.tags,
    isFirst: values.isFirst,
  };
}

function formValuesToPreview(
  values: QuestionFormValues,
  answerOptions: QuestionAnswerOptionDraft[]
): QuestionViewModel {
  const payload = formValuesToPayload(values, answerOptions);
  const questionImageUrl = buildQuestionImageUrl(payload.cdnImagePrefix ?? null, payload.questionImage ?? null);

  return {
    id: 'draft',
    question: payload.question || '--',
    cdnImagePrefix: payload.cdnImagePrefix ?? null,
    questionImage: payload.questionImage ?? null,
    questionImageUrl,
    correctAnswer: payload.correctAnswer || '--',
    incorrectAnswers: payload.incorrectAnswers,
    explanation: payload.explanation || '--',
    difficulty: payload.difficulty || '',
    category: payload.category || '',
    subCategory: payload.subCategory || null,
    tags: payload.tags ?? [],
    isFirst: payload.isFirst ?? false,
    createdAt: null,
    updatedAt: null,
  };
}

export function QuestionEditorClient({ locale, mode, id, usb }: QuestionEditorClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<QuestionFormValues>(emptyFormValues());
  const [answerOptions, setAnswerOptions] = useState<QuestionAnswerOptionDraft[]>([]);
  const [previewAsPlayer, setPreviewAsPlayer] = useState(false);
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
        setAnswerOptions(detailToAnswerOptions(data));
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

  const previewQuestion = useMemo(() => formValuesToPreview(values, answerOptions), [answerOptions, values]);
  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = formValuesToPayload(values, answerOptions);
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {usb.loading}
          </div>
        ) : (
          <>
            <QuestionForm
              values={values}
              answerOptions={answerOptions}
              onAnswerOptionsChange={setAnswerOptions}
              onChange={(nextValues) =>
                setValues({
                  ...nextValues,
                  cdnImagePrefix: resolveCdnImagePrefix(nextValues.cdnImagePrefix),
                })
              }
              questionNotice={mode === 'create' ? usb.noticeCreate : usb.noticeEdit}
              usb={usb.form}
            />
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {usb.submitFailed}
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
                {saving ? usb.saving : mode === 'create' ? usb.createButton : usb.updateButton}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="lg:self-start">
        <QuestionPreview
          locale={locale}
          question={previewQuestion}
          answerOptions={answerOptions}
          previewAsPlayer={previewAsPlayer}
          onTogglePreviewMode={() => setPreviewAsPlayer((value) => !value)}
        />
      </div>
    </div>
  );
}
