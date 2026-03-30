'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { SiteEyeIcon, SiteEyeOffIcon } from '@/lib/site-config';
import { loadQuestionGroupContext } from './question-group-context';
import {
  buildAnswerOptionDrafts,
  splitAnswerOptionDrafts,
  type QuestionAnswerOptionDraft,
} from './question-answer-options';
import { QuestionDetail } from './question-detail';
import { QuestionForm } from './question-form';
import type { QuestionDetailDto, QuestionMutationResult, QuestionUpsertInput } from '@/server/questions/types';
import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

const CDN_BASE_URL = process.env.NEXT_PUBLIC_STYLE_CDN_URL?.trim() ?? '';
const CDN_IMAGE_PREFIX = process.env.NEXT_PUBLIC_STYLE_CDN_IMG_PREFIX?.trim() ?? '';

type QuestionEditorClientProps = {
  locale: string;
  mode: 'create' | 'edit';
  id?: string;
  initialPreviewOpen?: boolean;
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
      asFirst: string;
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
    asFirst: false,
  };
}

function detailToAnswerOptions(detail: QuestionDetailDto): QuestionAnswerOptionDraft[] {
  return buildAnswerOptionDrafts(detail.correctAnswer, detail.incorrectAnswers, detail.correctAnswerIndex);
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
    asFirst: detail.asFirst,
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
    correctAnswerIndex: answers.correctAnswerIndex,
    incorrectAnswers: answers.incorrectAnswers,
    explanation: values.explanation.trim(),
    difficulty: values.difficulty.trim(),
    category: values.category.trim(),
    subCategory: values.subCategory.trim(),
    tags: values.tags,
    asFirst: values.asFirst,
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
    asFirst: payload.asFirst ?? false,
    createdAt: null,
    updatedAt: null,
  };
}

export function QuestionEditorClient({
  locale,
  mode,
  id,
  initialPreviewOpen = false,
  usb,
}: QuestionEditorClientProps) {
  const isZh = locale === 'zh';
  const router = useRouter();
  const [values, setValues] = useState<QuestionFormValues>(emptyFormValues());
  const [answerOptions, setAnswerOptions] = useState<QuestionAnswerOptionDraft[]>([]);
  const [previewAsPlayer, setPreviewAsPlayer] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>(initialPreviewOpen ? 'preview' : 'edit');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupIds, setGroupIds] = useState<string[]>([]);

  useEffect(() => {
    setActiveView(initialPreviewOpen ? 'preview' : 'edit');
  }, [initialPreviewOpen]);

  useEffect(() => {
    if (!id) {
      setGroupIds([]);
      return;
    }

    const context = loadQuestionGroupContext();
    const nextGroupIds = context?.groupIds ?? [];

    setGroupIds(nextGroupIds.includes(id) ? nextGroupIds : []);
  }, [id]);

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
  const currentGroupIndex = id ? groupIds.findIndex((item) => item === id) : -1;
  const previousQuestionId = currentGroupIndex > 0 ? groupIds[currentGroupIndex - 1] : null;
  const nextQuestionId = currentGroupIndex >= 0 && currentGroupIndex < groupIds.length - 1 ? groupIds[currentGroupIndex + 1] : null;

  function handleQuestionNavigation(targetId: string | null) {
    if (!targetId) {
      return;
    }

    router.push(getAsNeededLocalizedUrl(locale, `/questions/${targetId}`));
  }

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

      const data = (await response.json()) as QuestionMutationResult;
      router.push(getAsNeededLocalizedUrl(locale, `/questions/${data.id}`));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = saving ? usb.saving : mode === 'create' ? usb.createButton : usb.updateButton;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-black/10 bg-white/90 p-1 shadow-sm dark:border-white/10 dark:bg-slate-950/90">
          <button
            type="button"
            onClick={() => setActiveView('edit')}
            className={
              activeView === 'edit'
                ? 'rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-950'
                : 'rounded-full px-5 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {isZh ? '编辑' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('preview')}
            className={
              activeView === 'preview'
                ? 'rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-950'
                : 'rounded-full px-5 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {isZh ? '预览' : 'Preview'}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="rounded-3xl border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          {usb.loading}
        </div>
      ) : activeView === 'edit' ? (
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
        </>
      ) : (
        <QuestionDetail
          locale={locale}
          question={previewQuestion}
          answerOptions={answerOptions}
          previewAsPlayer={previewAsPlayer}
          bottomActions={(
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuestionNavigation(previousQuestionId)}
                  disabled={!previousQuestionId}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  {isZh ? '上一题' : 'Previous'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionNavigation(nextQuestionId)}
                  disabled={!nextQuestionId}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  {isZh ? '下一题' : 'Next'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewAsPlayer((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-500 transition hover:border-black/20 hover:bg-black/5 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-pressed={previewAsPlayer}
                  aria-label={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
                  title={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
                >
                  {previewAsPlayer ? <SiteEyeOffIcon className="h-4 w-4" /> : <SiteEyeIcon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void onSubmit()}
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={submitLabel}
                  title={submitLabel}
                >
                  <icons.QrCode className="h-4 w-4" />
                  <span>{submitLabel}</span>
                </button>
              </div>
            </>
          )}
        />
      )}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          {usb.submitFailed}
          {error}
        </div>
      ) : null}
    </div>
  );
}
