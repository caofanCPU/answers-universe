'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';
import { XButton, XToggleButton } from '@windrun-huaiin/third-ui/main';
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
  backHref: string;
  backLabel: string;
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
  backHref,
  backLabel,
  usb,
}: QuestionEditorClientProps) {
  const isZh = locale === 'zh';
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
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

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
  const hasGroupNavigation = currentGroupIndex >= 0 && groupIds.length > 1;

  function openPreview() {
    setActiveView('preview');
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

  const submitLabel = submitSucceeded
    ? isZh
      ? '已提交'
      : 'Saved'
    : saving
      ? usb.saving
      : mode === 'create'
        ? usb.createButton
        : usb.updateButton;
  const activeStatusText =
    activeView === 'edit'
      ? isZh
        ? '草稿态'
        : 'Draft'
      : isZh
        ? hasGroupNavigation
          ? `${currentGroupIndex + 1}/${groupIds.length}`
          : '预览态'
        : hasGroupNavigation
          ? `${currentGroupIndex + 1}/${groupIds.length}`
          : 'Preview';

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 pb-32">
      <div className="sticky top-4 z-20 w-full">
        <div className="rounded-[1.75rem] border border-black/10 p-3 dark:border-white/10">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:grid-cols-[12rem_minmax(0,1fr)_12rem]">
            <div className="flex min-w-0 items-center">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 sm:px-4"
                aria-label={backLabel}
                title={backLabel}
              >
                <icons.ChevronLeft className="h-4 w-4" />
                <span className="hidden lg:inline">{backLabel}</span>
              </Link>
            </div>

            <div className="flex min-w-0 justify-center">
              <XToggleButton
                ariaLabel={isZh ? '编辑与预览切换' : 'Edit and preview toggle'}
                value={activeView}
                onChange={(value) => {
                  if (value === 'preview') {
                    openPreview();
                    return;
                  }

                  setActiveView('edit');
                }}
                options={[
                  { value: 'edit', label: isZh ? '编辑' : 'Edit' },
                  { value: 'preview', label: isZh ? '预览' : 'Preview' },
                ]}
                size="compact"
                className="max-w-full border-black/10 dark:border-white/10"
                minItemWidthClassName="min-w-[72px] sm:min-w-[88px]"
                itemPaddingClassName="px-5 py-2"
                itemTextClassName="text-sm"
                inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
              />
            </div>
          </div>
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
        />
      )}
      <div className="sticky bottom-4 z-20 w-full">
        <div className="rounded-[1.75rem] border border-black/10 bg-neutral-100 p-3 dark:border-white/10 dark:bg-neutral-900">
          {activeView === 'edit' ? (
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <SiteEyeOffIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 wrap-break-word">{isZh ? '草稿态，修改需先预览确认后提交。' : 'Draft state. Review in preview before submit.'}</span>
              </div>
              <div className="flex min-w-0 items-center justify-end gap-2">
                <div
                  className="inline-flex min-w-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300"
                  aria-label={activeStatusText}
                  title={activeStatusText}
                >
                  <SiteEyeOffIcon className="h-4 w-4" />
                  <span className="truncate">{activeStatusText}</span>
                </div>
                <XButton
                  type="single"
                  variant="subtle"
                  minWidth="min-w-0"
                  className="self-end px-4 py-2.5 sm:px-5 sm:py-3"
                  button={{
                    icon: <SiteEyeIcon className="h-4 w-4" />,
                    text: isZh ? '去预览确认' : 'Review in Preview',
                    onClick: openPreview,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                {hasGroupNavigation ? (
                  <button
                    type="button"
                    onClick={() => handleQuestionNavigation(previousQuestionId)}
                    disabled={!previousQuestionId}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                    aria-label={isZh ? '上一题' : 'Previous'}
                    title={isZh ? '上一题' : 'Previous'}
                  >
                    <icons.ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div
                  className="inline-flex min-w-0 items-center rounded-full border border-black/10 bg-slate-50/90 p-1 dark:border-white/10 dark:bg-white/5"
                  aria-label={hasGroupNavigation ? `${isZh ? '当前进度' : 'Progress'} ${activeStatusText}` : activeStatusText}
                  title={hasGroupNavigation ? `${isZh ? '当前进度' : 'Progress'} ${activeStatusText}` : activeStatusText}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewAsPlayer((value) => !value)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    aria-pressed={previewAsPlayer}
                    aria-label={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
                    title={previewAsPlayer ? (isZh ? '显示完整预览' : 'Show full preview') : isZh ? '切换答题视角' : 'Switch to player view'}
                  >
                    {previewAsPlayer ? <SiteEyeOffIcon className="h-4 w-4" /> : <SiteEyeIcon className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 px-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300 sm:px-3">
                    <span className="truncate">{activeStatusText}</span>
                  </div>
                </div>
                {hasGroupNavigation ? (
                  <button
                    type="button"
                    onClick={() => handleQuestionNavigation(nextQuestionId)}
                    disabled={!nextQuestionId}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                    aria-label={isZh ? '下一题' : 'Next'}
                    title={isZh ? '下一题' : 'Next'}
                  >
                    <icons.ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center justify-end">
                <GradientButton
                  onClick={() => void onSubmit()}
                  disabled={saving || loading}
                  title={submitLabel}
                  align="center"
                  icon=<icons.BookCheck/>
                  className="min-w-0 sm:w-auto"
                />
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
