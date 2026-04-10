'use client';

import { useMemo, useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';
import { XButton, XToggleButton } from '@windrun-huaiin/third-ui/main';
import { XFormPills } from '@windrun-huaiin/third-ui/main/pill-select';
import type {
  QuestionImportCommitResult,
  QuestionImportDisplayFieldKey,
  QuestionImportFieldKey,
  QuestionImportValidationItem,
  QuestionImportValidationResult,
} from '@/server/questions/types';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';

type RawImportItem = {
  importId?: unknown;
  question?: unknown;
  cdnImagePrefix?: unknown;
  cdn_image_prefix?: unknown;
  questionImage?: unknown;
  question_image?: unknown;
  correctAnswer?: unknown;
  correct_answer?: unknown;
  correctAnswerIndex?: unknown;
  correct_answer_index?: unknown;
  incorrectAnswers?: unknown;
  incorrect_answers?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  category?: unknown;
  subCategory?: unknown;
  sub_category?: unknown;
  tags?: unknown;
  keywords?: unknown;
  asFirst?: unknown;
  as_first?: unknown;
};

type ParseResult = {
  rawItems: RawImportItem[];
  parseError: string | null;
};

type WorkbenchTab = 'importable' | 'invalid';

const sampleJson = `[
  {
    "question": "Which USB connector is reversible and commonly used by modern laptops and phones?",
    "correctAnswer": "USB-C",
    "correctAnswerIndex": 1,
    "incorrectAnswers": ["USB-A", "Mini USB", "Micro USB"],
    "explanation": "USB-C is reversible and widely adopted in modern devices.",
    "difficulty": "easy",
    "category": "Tech & Innovation",
    "subCategory": "science",
    "tags": ["usb", "connector", "hardware"],
    "asFirst": true
  }
]`;

const fieldLabels: Record<QuestionImportFieldKey, string> = {
  question: 'Question',
  cdnImagePrefix: 'CDN Image Prefix',
  questionImage: 'Question Image',
  correctAnswer: 'Correct Answer',
  correctAnswerIndex: 'Correct Answer Index',
  incorrectAnswers: 'Incorrect Answers',
  explanation: 'Explanation',
  difficulty: 'Difficulty',
  category: 'Category',
  subCategory: 'Sub Category',
  tags: 'Tags',
  keywords: 'Keywords',
  asFirst: 'As First',
};

function getFieldPlaceholder(field: QuestionImportFieldKey, isZh: boolean): string {
  if (isZh) {
    switch (field) {
      case 'question':
        return '请输入题目内容';
      case 'cdnImagePrefix':
        return '请输入 CDN 前缀';
      case 'questionImage':
        return '请输入题图路径';
      case 'correctAnswer':
        return '请输入正确答案';
      case 'correctAnswerIndex':
        return '请输入正确答案序号';
      case 'incorrectAnswers':
        return '每行一个错误答案';
      case 'explanation':
        return '请输入题目解析';
      case 'difficulty':
        return '请选择难度';
      case 'category':
        return '请选择分类';
      case 'subCategory':
        return '请选择子分类';
      case 'tags':
        return '多个标签用逗号或换行分隔';
      case 'keywords':
        return '多个关键词用逗号或换行分隔';
      case 'asFirst':
        return '是否作为首题';
    }
  }

  switch (field) {
    case 'question':
      return 'Enter the question text';
    case 'cdnImagePrefix':
      return 'Enter CDN image prefix';
    case 'questionImage':
      return 'Enter image path';
    case 'correctAnswer':
      return 'Enter the correct answer';
    case 'correctAnswerIndex':
      return 'Enter the answer index';
    case 'incorrectAnswers':
      return 'One incorrect answer per line';
    case 'explanation':
      return 'Enter the explanation';
    case 'difficulty':
      return 'Select difficulty';
    case 'category':
      return 'Select category';
    case 'subCategory':
      return 'Select sub category';
    case 'tags':
      return 'Separate tags with commas or line breaks';
    case 'keywords':
      return 'Separate keywords with commas or line breaks';
    case 'asFirst':
      return 'Whether it is the first question';
  }
}

function normalizeImportItemAliases(item: RawImportItem): RawImportItem {
  return {
    ...item,
    cdnImagePrefix: item.cdnImagePrefix ?? item.cdn_image_prefix,
    questionImage: item.questionImage ?? item.question_image,
    correctAnswer: item.correctAnswer ?? item.correct_answer,
    correctAnswerIndex: item.correctAnswerIndex ?? item.correct_answer_index,
    incorrectAnswers: item.incorrectAnswers ?? item.incorrect_answers,
    subCategory: item.subCategory ?? item.sub_category,
    asFirst: item.asFirst ?? item.as_first,
  };
}

function parseImportText(source: string): ParseResult {
  if (!source.trim()) {
    return {
      rawItems: [],
      parseError: null,
    };
  }

  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        rawItems: [],
        parseError: 'Root JSON value must be an array.',
      };
    }

    return {
      rawItems: (parsed as RawImportItem[]).map(normalizeImportItemAliases),
      parseError: null,
    };
  } catch (error) {
    return {
      rawItems: [],
      parseError: error instanceof Error ? error.message : 'JSON parse failed',
    };
  }
}

function createImportId(index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `imp_${crypto.randomUUID()}`;
  }

  return `imp_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function withImportIds(items: RawImportItem[]): RawImportItem[] {
  return items.map((item, index) => {
    const normalized = normalizeImportItemAliases(item);
    const importId =
      typeof normalized.importId === 'string' && normalized.importId.trim().length > 0
        ? normalized.importId.trim()
        : createImportId(index);

    return {
      ...normalized,
      importId,
    };
  });
}

function toRequestItem(item: QuestionImportValidationItem | RawImportItem): Record<string, unknown> {
  if ('valid' in item) {
    return {
      importId: item.importId,
      question: item.question,
      cdnImagePrefix: item.cdnImagePrefix,
      questionImage: item.questionImage,
      correctAnswer: item.correctAnswer,
      correctAnswerIndex: item.correctAnswerIndex ?? undefined,
      incorrectAnswers: item.incorrectAnswers,
      explanation: item.explanation,
      difficulty: item.difficulty,
      category: item.category,
      subCategory: item.subCategory ?? '',
      tags: item.tags,
      keywords: item.keywords,
      asFirst: item.asFirst,
    };
  }

  return normalizeImportItemAliases(item) as Record<string, unknown>;
}

function getDisplayFieldLabel(key: QuestionImportDisplayFieldKey, isZh: boolean): string {
  if (key === 'fullInsertSql') {
    return isZh ? '完整 SQL' : 'Full SQL';
  }

  return isZh ? '完整 UUID SQL' : 'Full UUID SQL';
}

function getFieldLabel(field: QuestionImportFieldKey, isZh: boolean): string {
  if (isZh) {
    switch (field) {
      case 'question':
        return '题目';
      case 'cdnImagePrefix':
        return 'CDN 前缀';
      case 'questionImage':
        return '题图';
      case 'correctAnswer':
        return '正确答案';
      case 'correctAnswerIndex':
        return '正确答案序号';
      case 'incorrectAnswers':
        return '错误答案';
      case 'explanation':
        return '解析';
      case 'difficulty':
        return '难度';
      case 'category':
        return '分类';
      case 'subCategory':
        return '子分类';
      case 'tags':
        return '标签';
      case 'keywords':
        return '关键词';
      case 'asFirst':
        return '首题';
    }
  }

  return fieldLabels[field];
}

function renderInputClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 outline-none transition dark:bg-slate-900 dark:text-white ${
    hasError
      ? 'border-red-300 bg-red-50/60 focus:border-red-400 dark:border-red-500/40 dark:bg-red-500/10'
      : 'border-black/10 bg-slate-50 focus:border-purple-400 dark:border-white/10 dark:bg-slate-900'
  }`;
}

function renderCountBadge(count: number, tone: 'neutral' | 'success' | 'danger') {
  const toneClassName =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'danger'
        ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300';

  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${toneClassName}`}>
      {count}
    </span>
  );
}

function getSummaryIcon(kind: 'total' | 'importable' | 'invalid' | 'imported') {
  switch (kind) {
    case 'total':
      return '📊';
    case 'importable':
      return '✅';
    case 'invalid':
      return '❌';
    case 'imported':
      return '✅';
  }
}

export function QuestionImportClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const [source, setSource] = useState(sampleJson);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [revalidatingItemId, setRevalidatingItemId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<QuestionImportCommitResult | null>(null);
  const [copiedField, setCopiedField] = useState<QuestionImportDisplayFieldKey | null>(null);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('invalid');
  const [importableItems, setImportableItems] = useState<QuestionImportValidationItem[]>([]);
  const [invalidItems, setInvalidItems] = useState<QuestionImportValidationItem[]>([]);
  const [currentInvalidIndex, setCurrentInvalidIndex] = useState(0);
  const [validated, setValidated] = useState(false);

  const result = useMemo(() => parseImportText(source), [source]);
  const currentInvalidItem = invalidItems[currentInvalidIndex] ?? null;
  const totalCount = validated ? importableItems.length + invalidItems.length : result.rawItems.length;
  const validCount = validated ? importableItems.length : 0;
  const invalidCount = validated ? invalidItems.length : 0;

  function resetWorkbench() {
    setValidated(false);
    setImportableItems([]);
    setInvalidItems([]);
    setCurrentInvalidIndex(0);
    setActiveTab('invalid');
    setCommitResult(null);
    setServerError(null);
  }

  function handleSourceChange(nextValue: string) {
    setSource(nextValue);
    resetWorkbench();
  }

  function switchWorkbenchTab(nextTab: WorkbenchTab) {
    setActiveTab(nextTab);
    window.requestAnimationFrame(() => {
      workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleValidateAll() {
    resetWorkbench();

    if (result.parseError) {
      return;
    }

    const items = withImportIds(result.rawItems);
    if (items.length === 0) {
      setValidated(true);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/questions/import/validate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: items.map(toRequestItem) }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportValidationResult;
      const nextImportable = data.items.filter((item) => item.valid);
      const nextInvalid = data.items.filter((item) => !item.valid);

      setImportableItems(nextImportable);
      setInvalidItems(nextInvalid);
      setCurrentInvalidIndex(0);
      setActiveTab(nextInvalid.length > 0 ? 'invalid' : 'importable');
      setValidated(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setValidating(false);
    }
  }

  async function handleRevalidateCurrent() {
    if (!currentInvalidItem) {
      return;
    }

    setRevalidatingItemId(currentInvalidItem.importId);
    setServerError(null);

    try {
      const response = await fetch('/api/questions/import/validate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [toRequestItem(currentInvalidItem)] }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportValidationResult;
      const nextItem = data.items[0];

      setInvalidItems((items) =>
        items.map((item) => (item.importId === nextItem.importId ? nextItem : item))
      );
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setRevalidatingItemId(null);
    }
  }

  function handleMoveCurrentToImportable() {
    if (!currentInvalidItem || !currentInvalidItem.valid) {
      return;
    }

    setImportableItems((items) => [...items, currentInvalidItem]);
    setInvalidItems((items) => {
      const nextItems = items.filter((item) => item.importId !== currentInvalidItem.importId);
      const nextIndex = Math.min(currentInvalidIndex, Math.max(nextItems.length - 1, 0));
      setCurrentInvalidIndex(nextIndex);
      if (nextItems.length === 0) {
        setActiveTab('importable');
      }
      return nextItems;
    });
  }

  async function handleCommitImportable() {
    if (importableItems.length === 0) {
      return;
    }

    setCommitting(true);
    setServerError(null);
    setCommitResult(null);

    try {
      const response = await fetch('/api/questions/import/commit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: importableItems.map(toRequestItem) }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QuestionImportCommitResult;
      const importedIds = new Set(data.importedImportIds);

      setImportableItems((items) => items.filter((item) => !importedIds.has(item.importId)));
      setCommitResult(data);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCommitting(false);
    }
  }

  async function copyText(field: QuestionImportDisplayFieldKey, value: string) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedField(field);

    if (copyResetTimerRef.current) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopiedField(null);
      copyResetTimerRef.current = null;
    }, 1400);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.trim().toLowerCase().endsWith('.json')) {
      setServerError(isZh ? '仅支持上传 JSON 文件。' : 'Only JSON files are supported.');
      return;
    }

    try {
      const text = await file.text();
      handleSourceChange(text);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to read file');
    }
  }

  function updateCurrentInvalidItem(field: QuestionImportFieldKey, value: string | string[] | boolean | number | null) {
    if (!currentInvalidItem) {
      return;
    }

    const nextItem = {
      ...currentInvalidItem,
      [field]: value,
      fieldErrors: {
        ...currentInvalidItem.fieldErrors,
        [field]: undefined,
      },
      valid: false,
    } as QuestionImportValidationItem;

    setInvalidItems((items) =>
      items.map((item) => (item.importId === currentInvalidItem.importId ? nextItem : item))
    );
  }

  function renderEditableField(item: QuestionImportValidationItem, field: QuestionImportFieldKey) {
    const error = item.fieldErrors[field];
    const label = getFieldLabel(field, isZh);
    const hasError = Boolean(error);
    const placeholder = getFieldPlaceholder(field, isZh);

    if (field === 'difficulty' || field === 'category' || field === 'subCategory') {
      const options =
        field === 'difficulty'
          ? QUESTION_DIFFICULTIES
          : field === 'category'
            ? QUESTION_CATEGORIES
            : QUESTION_SUB_CATEGORIES;
      const value =
        field === 'difficulty'
          ? item.difficulty
          : field === 'category'
            ? item.category
            : item.subCategory ?? '';

      return (
        <div key={field} className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <span>{label}</span>
            {hasError ? <span className="text-red-500">*</span> : null}
          </div>
          <div
            className={`rounded-2xl border px-3 py-3 ${
              hasError
                ? 'border-red-300 bg-red-50/60 dark:border-red-500/40 dark:bg-red-500/10'
                : 'border-black/10 bg-slate-50 dark:border-white/10 dark:bg-slate-900'
            }`}
          >
            <XFormPills
              label=""
              value={value}
              options={options.map((option) => ({ label: option, value: option }))}
              onChange={(nextValue) => updateCurrentInvalidItem(field, nextValue)}
              emptyLabel={placeholder}
              allowClear={field === 'subCategory'}
            />
          </div>
          {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
        </div>
      );
    }

    if (field === 'incorrectAnswers' || field === 'question' || field === 'explanation' || field === 'tags' || field === 'keywords') {
      const value =
        field === 'incorrectAnswers'
          ? item.incorrectAnswers.join('\n')
          : field === 'tags'
            ? item.tags.join(', ')
            : field === 'keywords'
              ? item.keywords.join(', ')
              : String(item[field] ?? '');

      return (
        <label key={field} className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <span>{label}</span>
            {hasError ? <span className="text-red-500">*</span> : null}
          </div>
          <textarea
            value={value}
            rows={field === 'question' ? 4 : 5}
            placeholder={placeholder}
            onChange={(event) => {
              if (field === 'incorrectAnswers') {
                updateCurrentInvalidItem(
                  field,
                  event.target.value
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                );
                return;
              }

              if (field === 'tags' || field === 'keywords') {
                updateCurrentInvalidItem(
                  field,
                  event.target.value
                    .split(/[,，\n|]+/)
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                );
                return;
              }

              updateCurrentInvalidItem(field, event.target.value);
            }}
            className={renderInputClass(hasError)}
          />
          {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
        </label>
      );
    }

    if (field === 'correctAnswerIndex') {
      return (
        <label key={field} className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <span>{label}</span>
            {hasError ? <span className="text-red-500">*</span> : null}
          </div>
          <input
            type="number"
            value={item.correctAnswerIndex ?? ''}
            placeholder={placeholder}
            onChange={(event) =>
              updateCurrentInvalidItem(field, event.target.value === '' ? null : Number(event.target.value))
            }
            className={renderInputClass(hasError)}
          />
          {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
        </label>
      );
    }

    if (field === 'asFirst') {
      return (
        <label key={field} className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <span>{label}</span>
            {hasError ? <span className="text-red-500">*</span> : null}
          </div>
          <div className={renderInputClass(hasError)}>
            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={item.asFirst}
                onChange={(event) => updateCurrentInvalidItem(field, event.target.checked)}
              />
              <span>{isZh ? '作为首题导入' : 'Import as first question'}</span>
            </label>
          </div>
          {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
        </label>
      );
    }

    return (
      <label key={field} className="space-y-2 text-sm">
        <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
          <span>{label}</span>
          {hasError ? <span className="text-red-500">*</span> : null}
        </div>
        <input
          value={String(item[field] ?? '')}
          placeholder={placeholder}
          onChange={(event) => updateCurrentInvalidItem(field, event.target.value)}
          className={renderInputClass(hasError)}
        />
        {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => void handleFileSelect(event)}
        />
        <div className="border-b border-black/10 pb-4 dark:border-white/10">
          <div className="space-y-3">
            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center justify-center gap-1.5 md:justify-start">
              <div
                className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5"
                title={isZh ? '总数' : 'Total'}
              >
                <span className="text-xs" aria-hidden="true">
                  {getSummaryIcon('total')}
                </span>
                {renderCountBadge(totalCount, 'neutral')}
              </div>
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => switchWorkbenchTab('importable')}
                  className="inline-flex items-center justify-center gap-1.5"
                  title={isZh ? '可导入' : 'Importable'}
                >
                  <span className="text-xs" aria-hidden="true">
                    {getSummaryIcon('importable')}
                  </span>
                  {renderCountBadge(validCount, 'success')}
                </button>
              </div>
              <div className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => switchWorkbenchTab('invalid')}
                  className="inline-flex items-center justify-center gap-1.5"
                  title={isZh ? '待修复' : 'To Fix'}
                >
                  <span className="text-xs" aria-hidden="true">
                    {getSummaryIcon('invalid')}
                  </span>
                  {renderCountBadge(invalidCount, 'danger')}
                </button>
              </div>
              {commitResult ? (
                <div
                  className="inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5"
                  title={isZh ? '已导入' : 'Imported'}
                >
                  <span className="text-xs" aria-hidden="true">
                    {getSummaryIcon('imported')}
                  </span>
                  {renderCountBadge(commitResult.successCount, 'success')}
                </div>
              ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2.5"
                button={{
                  icon: false,
                  text: isZh ? '上传 JSON' : 'Upload JSON',
                  onClick: () => fileInputRef.current?.click(),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2.5"
                button={{
                  icon: false,
                  text: isZh ? '载入示例' : 'Load Sample',
                  onClick: () => handleSourceChange(sampleJson),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2.5"
                button={{
                  icon: false,
                  text: isZh ? '新建导入' : 'New Import',
                  onClick: () => {
                    setSource(sampleJson);
                    resetWorkbench();
                  },
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2.5"
                loadingText={isZh ? '校验中...' : 'Loading...'}
                button={{
                  icon: false,
                  text: isZh ? '校验' : 'Validate',
                  onClick: () => void handleValidateAll(),
                  disabled: validating,
                }}
              />
              <div className="flex w-full justify-center md:w-auto md:justify-start">
                <GradientButton
                  onClick={() => void handleCommitImportable()}
                  disabled={committing || importableItems.length === 0}
                  title={isZh ? '导入可用项' : 'Import Valid'}
                  loadingText={isZh ? '导入中...' : 'Loading...'}
                  align="center"
                  icon=<icons.CheckCheck/>
                  className="sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <textarea
            value={source}
            onChange={(event) => handleSourceChange(event.target.value)}
            rows={20}
            className="min-h-128 w-full rounded-3xl border border-black/10 bg-slate-50 px-4 py-4 font-mono text-sm outline-none transition focus:border-purple-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {result.parseError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {result.parseError}
          </div>
        ) : null}
        {serverError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {serverError}
          </div>
        ) : null}
      </div>

      <div ref={workbenchRef} className="space-y-4">
        <div className="flex justify-center">
          <XToggleButton
            ariaLabel={isZh ? '导入工作台切换' : 'Import workbench toggle'}
            value={activeTab}
            onChange={(value) => setActiveTab(value as WorkbenchTab)}
            options={[
              { value: 'importable', label: isZh ? '可导入' : 'Importable' },
              { value: 'invalid', label: isZh ? '待修复' : 'To Fix' },
            ]}
            size="compact"
            className="max-w-full"
            minItemWidthClassName="min-w-[96px]"
            itemPaddingClassName="px-5 py-2"
            itemTextClassName="text-sm"
            inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
          />
        </div>

        {!validated ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {activeTab === 'importable'
              ? isZh
                ? '完成校验后，这里会显示可直接导入的数据。'
                : 'Run validation to see items that can be imported immediately.'
              : isZh
                ? '完成校验后，这里会显示待修复的数据卡片。'
                : 'Run validation to see the repair cards for invalid items.'}
          </div>
        ) : activeTab === 'importable' ? (
          importableItems.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {isZh ? '当前没有可导入的数据。' : 'There are no importable items yet.'}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {importableItems.map((item) => (
                <div
                  key={item.importId}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.question || (isZh ? '未填写题目' : 'Untitled question')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.importId}</div>
                    </div>
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {isZh ? '已通过校验，可直接导入' : 'Validated and ready to import'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : invalidItems.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {isZh ? '待修复区已经清空。' : 'The repair queue is empty.'}
          </div>
        ) : currentInvalidItem ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.75rem] border border-black/10 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isZh
                      ? `待修复 ${currentInvalidIndex + 1} / ${invalidItems.length}`
                      : `Fix ${currentInvalidIndex + 1} / ${invalidItems.length}`}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{currentInvalidItem.importId}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {currentInvalidItem.question || (isZh ? '当前题目内容为空' : 'Question content is empty')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {currentInvalidItem.category ? (
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {currentInvalidItem.category}
                      </span>
                    ) : null}
                    {currentInvalidItem.difficulty ? (
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {currentInvalidItem.difficulty}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentInvalidIndex((index) => Math.max(index - 1, 0))}
                    disabled={currentInvalidIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <icons.ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {isZh
                      ? `剩余错误 ${Object.keys(currentInvalidItem.fieldErrors).length}`
                      : `Errors ${Object.keys(currentInvalidItem.fieldErrors).length}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentInvalidIndex((index) => Math.min(index + 1, invalidItems.length - 1))}
                    disabled={currentInvalidIndex >= invalidItems.length - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <icons.ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {currentInvalidItem.valid ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                {isZh ? '当前这条已经校验通过，可以加入可导入区。' : 'This item is now valid. You can move it into the importable queue.'}
              </div>
            ) : null}

            {currentInvalidItem.globalErrors.length > 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {currentInvalidItem.globalErrors.join(' ; ')}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {(currentInvalidItem.valid
                ? []
                : (Object.keys(currentInvalidItem.fieldErrors) as QuestionImportFieldKey[])
              ).map((field) => renderEditableField(currentInvalidItem, field))}
            </div>

            {!currentInvalidItem.valid ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                {isZh
                  ? '字段修改完成后，请点击“重新校验本条”，通过后再加入可导入区。'
                  : 'After editing, revalidate this item before moving it into the importable queue.'}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <XButton
                type="single"
                variant="subtle"
                minWidth="min-w-0"
                className="px-4 py-2.5"
                loadingText={isZh ? '校验中...' : 'Loading...'}
                button={{
                  icon: false,
                  text: isZh ? '重新校验本条' : 'Revalidate Current',
                  onClick: () => void handleRevalidateCurrent(),
                  disabled: revalidatingItemId === currentInvalidItem.importId,
                }}
              />
              <GradientButton
                onClick={() => handleMoveCurrentToImportable()}
                disabled={!currentInvalidItem.valid}
                title={isZh ? '加入可导入区' : 'Move to Importable'}
                align="center"
                icon=<icons.CheckCheck/>
                className="sm:w-auto"
              />
            </div>
          </div>
        ) : null}
      </div>

      {commitResult ? (
        <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isZh ? '导入结果' : 'Import Result'}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {isZh ? `总计 ${commitResult.total}` : `Total ${commitResult.total}`}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {isZh ? `成功 ${commitResult.successCount}` : `Success ${commitResult.successCount}`}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {isZh ? `失败 ${commitResult.failedCount}` : `Failed ${commitResult.failedCount}`}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {commitResult.displayFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {getDisplayFieldLabel(field.key, isZh)}
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(field.key, field.value)}
                    className="inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-black/20 hover:bg-black/5 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {copiedField === field.key ? <icons.X className="h-3.5 w-3.5" /> : <icons.Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === field.key ? 'Copied' : isZh ? '复制' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={field.value}
                  rows={field.key === 'fullInsertSql' ? 6 : 4}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
