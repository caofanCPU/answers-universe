'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookCheckIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '@windrun-huaiin/base-ui/icons';
import { GradientButton, XButton } from '@windrun-huaiin/third-ui/main/buttons';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { QUESTION_DEFAULT_DIFFICULTY } from '@/server/questions/constants';
import { QUESTION_GROUP_STORAGE_KEY } from './question-group-context';
import {
  buildAnswerOptionDrafts,
  splitAnswerOptionDrafts,
  type QuestionAnswerOptionDraft,
} from './question-answer-options';
import { QuestionDetail } from './question-detail';
import { QuestionForm } from './question-form';
import type { QuestionEditorCopy } from './question-copy';
import { QuestionDetailSkeleton, QuestionEditorSkeleton } from './question-skeleton-blocks';
import type { QuestionDetailDto, QuestionMutationResult, QuestionUpsertInput } from '@/server/questions/types';
import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

const CDN_BASE_URL = process.env.NEXT_PUBLIC_STYLE_CDN_URL?.trim() ?? '';
const CDN_IMAGE_PREFIX = process.env.NEXT_PUBLIC_STYLE_CDN_IMG_PREFIX?.trim() ?? '';

type QuestionEditorClientProps = {
  locale: string;
  mode: 'create' | 'edit';
  id?: string;
  initialPreviewOpen?: boolean;
  usb: QuestionEditorCopy;
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
    difficulty: QUESTION_DEFAULT_DIFFICULTY,
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
    difficulty: detail.difficulty || QUESTION_DEFAULT_DIFFICULTY,
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
    difficulty: values.difficulty.trim() || QUESTION_DEFAULT_DIFFICULTY,
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
    difficulty: payload.difficulty || QUESTION_DEFAULT_DIFFICULTY,
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
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<QuestionFormValues>(emptyFormValues());
  const [answerOptions, setAnswerOptions] = useState<QuestionAnswerOptionDraft[]>([]);
  const [previewAsPlayer, setPreviewAsPlayer] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>(initialPreviewOpen ? 'preview' : 'edit');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const groupIds = useMemo(() => {
    if (!id || !isClient) {
      return [];
    }

    try {
      const raw = window.sessionStorage.getItem(QUESTION_GROUP_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as { groupIds?: unknown };
      if (!Array.isArray(parsed.groupIds)) {
        return [];
      }

      const nextGroupIds = parsed.groupIds.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      );
      return nextGroupIds.includes(id) ? nextGroupIds : [];
    } catch {
      return [];
    }
  }, [id, isClient]);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

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
  const hasGroupNavigation = currentGroupIndex >= 0 && groupIds.length > 1;

  function openPreview() {
    setActiveView('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit() {
    setActiveView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleQuestionNavigation(targetId: string | null) {
    if (!targetId) {
      return;
    }

    router.push(getAsNeededLocalizedUrl(locale, `/questions/${targetId}`));
  }

  async function onSubmit() {
    setSaving(true);
    setSubmitSucceeded(false);
    setError(null);

    try {
      const payload = formValuesToPayload(values, answerOptions);
      const url = mode === 'create' ? '/api/questions' : `/api/questions/${id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const startedAt = Date.now();

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
      const minimumSavingDuration = 700;
      const elapsed = Date.now() - startedAt;

      if (elapsed < minimumSavingDuration) {
        await new Promise((resolve) => setTimeout(resolve, minimumSavingDuration - elapsed));
      }

      const destination = getAsNeededLocalizedUrl(locale, `/questions/${data.id}`);
      const isSamePreviewRoute = pathname === destination;

      setSubmitSucceeded(true);

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }

      if (isSamePreviewRoute) {
        successTimerRef.current = setTimeout(() => {
          setSubmitSucceeded(false);
        }, 1400);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 450));
      router.push(destination);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = submitSucceeded ? usb.saved : saving ? usb.saving : mode === 'create' ? usb.createButton : usb.updateButton;
  const activeStatusText =
    activeView === 'edit'
      ? usb.preview.edit
      : hasGroupNavigation
        ? `${currentGroupIndex + 1}/${groupIds.length}`
        : usb.preview.preview;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-18rem)] w-full max-w-6xl min-w-0 flex-col gap-4 pb-32">
      {loading ? (
        <div className="min-h-[560px]" aria-busy="true" aria-live="polite" aria-label={usb.loading}>
          {activeView === 'preview' ? <QuestionDetailSkeleton /> : <QuestionEditorSkeleton mode={mode} />}
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
          copy={usb.detail}
          previewAsPlayer={previewAsPlayer}
          previewToggle={{
            enabled: true,
            onToggle: () => setPreviewAsPlayer((value) => !value),
            showFullPreviewLabel: usb.preview.showFullPreview,
            switchToPlayerViewLabel: usb.preview.switchToPlayerView,
            showText: 'Show',
            hideText: 'Hide',
          }}
          editAction={{
            enabled: true,
            onClick: openEdit,
            label: usb.preview.edit,
          }}
        />
      )}
      <div className="sticky bottom-4 z-20 w-full">
        <div
          className={
            activeView === 'edit'
              ? 'rounded-[1.75rem] border border-black/10 bg-neutral-100 p-3 dark:border-white/10 dark:bg-neutral-900'
              : 'rounded-[1.75rem] bg-neutral-100 p-3 dark:bg-neutral-900'
          }
        >
          {activeView === 'edit' ? (
            <div className="flex min-w-0 justify-end">
              <div className="flex min-w-0 items-center justify-end gap-2">
                <XButton
                  type="single"
                  variant="subtle"
                  minWidth="min-w-0"
                  className="self-end px-4 py-2.5 sm:px-5 sm:py-3"
                  button={{
                    icon: <EyeIcon className="h-4 w-4" />,
                    text: usb.preview.reviewButton,
                    onClick: openPreview,
                  }}
                />
                <GradientButton
                  variant="soft"
                  onClick={() => void onSubmit()}
                  disabled={saving || loading}
                  title={submitLabel}
                  align="center"
                  icon={<BookCheckIcon />}
                  className="min-w-0 sm:w-auto"
                />
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <div aria-hidden="true" className="hidden min-w-0 lg:block" />
              {hasGroupNavigation ? (
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuestionNavigation(previousQuestionId)}
                    disabled={!previousQuestionId}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                    aria-label={usb.preview.previous}
                    title={usb.preview.previous}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <div
                    className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
                    aria-label={`${usb.preview.progress} ${activeStatusText}`}
                    title={`${usb.preview.progress} ${activeStatusText}`}
                  >
                    <div className="min-w-0 px-4 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                      <span className="truncate">{activeStatusText}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuestionNavigation(nextQuestionId)}
                    disabled={!nextQuestionId}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
                    aria-label={usb.preview.next}
                    title={usb.preview.next}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div aria-hidden="true" className="hidden min-w-0 lg:block" />
              )}
              <div className="flex min-w-0 items-center justify-end gap-2">
              </div>
            </div>
          )}
        </div>
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          {usb.submitFailed}
          {error}
        </div>
      ) : null}
    </div>
  );
}
