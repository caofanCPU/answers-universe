'use client';

import { useMemo, useState } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { XToggleButton } from '@windrun-huaiin/third-ui/main/buttons';
import { EyeIcon, EyeOffIcon } from '@windrun-huaiin/base-ui/icons';
import { themeButtonGradientClass, themeButtonGradientHoverClass, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { selectBestRandomQuestionSet, type RandomQuestionPlannerRecord } from '@/lib/random-question-planner';

type PlannerTestQuestion = RandomQuestionPlannerRecord & {
  code: string;
};

type QuickCase = {
  key: PlannerInputMode;
  label: string;
  description: string;
  codes: string[];
};

type PlannerInputMode = 'ten' | 'fourteen' | 'twenty-six' | 'custom';

const TARGET_TOTAL = 5;
const SHOW_DATE = '2026-04-30';
const CATEGORY_SEQUENCE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const themedGhostButtonClass = cn(
  'border-slate-300 bg-slate-200 hover:bg-slate-300 dark:border-white/10 dark:bg-slate-700 dark:hover:bg-slate-600',
  'hover:border-current',
  themeIconColor
);

const QUICK_CASES: QuickCase[] = [
  {
    key: 'ten',
    label: '10 questions',
    description: 'Small complete pool with two first questions and enough normal categories.',
    codes: ['0F-A', '0F-B', '1A', '2A', '1B', '2B', '1C', '1D', '1E', '1F'],
  },
  {
    key: 'fourteen',
    label: '14 questions',
    description: 'Includes extra normal inventory so the planner can avoid wasting categories.',
    codes: ['0F-A', '0F-C', '0F-D', '1A', '2A', '3A', '1B', '2B', '1C', '2C', '1D', '1E', '1F', '1G'],
  },
  {
    key: 'twenty-six',
    label: '26 questions',
    description: 'Larger mixed pool that can produce several groups before inventory runs out.',
    codes: [
      '0F-A',
      '0F-B',
      '0F-C',
      '0F-D',
      '0F-E',
      '1A',
      '2A',
      '3A',
      '1B',
      '2B',
      '3B',
      '1C',
      '2C',
      '3C',
      '1D',
      '2D',
      '3D',
      '1E',
      '2E',
      '1F',
      '2F',
      '1G',
      '2G',
      '1H',
      '1I',
      '1J',
    ],
  },
];

const QUICK_CASE_BY_KEY = new Map(QUICK_CASES.map((item) => [item.key, item]));

function parseQuestionCode(code: string, index: number): PlannerTestQuestion | null {
  const normalized = code.trim().toUpperCase();
  const firstMatch = /^0F-([A-Z][A-Z0-9]*)$/.exec(normalized);

  if (firstMatch) {
    return {
      id: BigInt(index + 1),
      code: normalized,
      asFirst: 1,
      category: firstMatch[1],
    };
  }

  const normalMatch = /^([1-9][0-9]*)([A-Z][A-Z0-9]*)$/.exec(normalized);

  if (!normalMatch) {
    return null;
  }

  return {
    id: BigInt(index + 1),
    code: normalized,
    asFirst: 0,
    category: normalMatch[2],
  };
}

function parseQuestionCodes(codes: string[]): {
  questions: PlannerTestQuestion[];
  invalidCodes: string[];
} {
  const questions: PlannerTestQuestion[] = [];
  const invalidCodes: string[] = [];

  for (const [index, code] of codes.map((item) => item.trim()).filter(Boolean).entries()) {
    const question = parseQuestionCode(code, index);

    if (question) {
      questions.push(question);
    } else {
      invalidCodes.push(code);
    }
  }

  return { questions, invalidCodes };
}

function generateCustomCodes(total: number, stable: boolean): string[] {
  const safeTotal = Math.min(100, Math.max(5, total));
  let seed = safeTotal * 2654435761;
  const nextRandom = stable
    ? () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0xffffffff;
      }
    : () => Math.random();
  const categoryCount = Math.min(
    CATEGORY_SEQUENCE.length,
    Math.max(5, Math.min(safeTotal - 1, Math.floor(4 + nextRandom() * Math.min(12, safeTotal))))
  );
  const activeCategories = CATEGORY_SEQUENCE.slice(0, categoryCount);
  const firstCount = Math.max(1, Math.min(Math.floor(safeTotal / TARGET_TOTAL), Math.ceil(categoryCount * 0.75)));
  const codes: string[] = [];
  const pickWeightedCategory = () => {
    const totalWeight = activeCategories.reduce((sum, _category, index) => sum + 1 / (index + 1), 0);
    let cursor = nextRandom() * totalWeight;

    for (const [index, category] of activeCategories.entries()) {
      cursor -= 1 / (index + 1);

      if (cursor <= 0) {
        return category;
      }
    }

    return activeCategories[activeCategories.length - 1];
  };
  const firstCategories = new Set<string>();

  while (firstCategories.size < firstCount) {
    firstCategories.add(pickWeightedCategory());
  }

  for (const category of firstCategories) {
    codes.push(`0F-${category}`);
  }

  const normalCounters = new Map<string, number>();

  while (codes.length < safeTotal) {
    const category = pickWeightedCategory();
    const nextCount = (normalCounters.get(category) ?? 0) + 1;
    normalCounters.set(category, nextCount);
    codes.push(`${nextCount}${category}`);
  }

  return codes;
}

function buildGroups(questions: PlannerTestQuestion[]): PlannerTestQuestion[][] {
  const remainingFirstQuestions = questions.filter((question) => question.asFirst === 1);
  const remainingNormalQuestions = questions.filter((question) => question.asFirst === 0);
  const groups: PlannerTestQuestion[][] = [];

  while (remainingFirstQuestions.length > 0 && remainingNormalQuestions.length > 0) {
    const result = selectBestRandomQuestionSet({
      firstQuestions: remainingFirstQuestions,
      normalQuestions: remainingNormalQuestions,
      showDate: SHOW_DATE,
      targetTotal: TARGET_TOTAL,
    });

    if (!result || result.normalQuestions.length < TARGET_TOTAL - 1) {
      break;
    }

    const group = [result.firstQuestion, ...result.normalQuestions];
    groups.push(group);

    const usedIds = new Set(group.map((question) => question.id.toString()));

    for (let index = remainingFirstQuestions.length - 1; index >= 0; index -= 1) {
      if (usedIds.has(remainingFirstQuestions[index].id.toString())) {
        remainingFirstQuestions.splice(index, 1);
      }
    }

    for (let index = remainingNormalQuestions.length - 1; index >= 0; index -= 1) {
      if (usedIds.has(remainingNormalQuestions[index].id.toString())) {
        remainingNormalQuestions.splice(index, 1);
      }
    }
  }

  return groups;
}

function QuestionTag({
  question,
  muted = false,
}: {
  question: PlannerTestQuestion;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        question.asFirst === 1
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200'
          : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200',
        muted && 'opacity-45'
      )}
      title={`${question.code} / category ${question.category}`}
    >
      {question.code}
    </span>
  );
}

export function RandomQuestionPlannerTestClient() {
  const [inputMode, setInputMode] = useState<PlannerInputMode>('twenty-six');
  const [inputTokens, setInputTokens] = useState(QUICK_CASES[2].codes);
  const [customTotal, setCustomTotal] = useState(32);
  const [customDraftTotal, setCustomDraftTotal] = useState('32');
  const [stableCustom, setStableCustom] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const { questions, invalidCodes } = useMemo(() => parseQuestionCodes(inputTokens), [inputTokens]);
  const groups = useMemo(() => buildGroups(questions), [questions]);
  const usedQuestionIds = useMemo(
    () => new Set(groups.flatMap((group) => group.map((question) => question.id.toString()))),
    [groups]
  );
  const remainingQuestions = questions.filter((question) => !usedQuestionIds.has(question.id.toString()));
  const inputFirstQuestions = questions.filter((question) => question.asFirst === 1);
  const inputNormalQuestions = questions.filter((question) => question.asFirst === 0);
  const firstCount = questions.filter((question) => question.asFirst === 1).length;
  const normalCount = questions.length - firstCount;
  const categoryCount = new Set(questions.map((question) => question.category)).size;
  const activeQuickCase = QUICK_CASE_BY_KEY.get(inputMode);
  const displayedTotal = inputMode === 'custom' ? customTotal : questions.length;

  function applyInputMode(nextMode: PlannerInputMode) {
    setInputMode(nextMode);

    if (nextMode === 'custom') {
      const nextTotal = Math.min(100, Math.max(5, Number(customDraftTotal) || 32));
      setCustomTotal(nextTotal);
      setCustomDraftTotal(String(nextTotal));
      setInputTokens(generateCustomCodes(nextTotal, stableCustom));
      return;
    }

    const quickCase = QUICK_CASE_BY_KEY.get(nextMode);

    if (quickCase) {
      setInputTokens(quickCase.codes);
    }
  }

  function generateCustomInput() {
    const nextTotal = Math.min(100, Math.max(5, Number(customDraftTotal) || 32));
    setInputMode('custom');
    setCustomTotal(nextTotal);
    setCustomDraftTotal(String(nextTotal));
    setInputTokens(generateCustomCodes(nextTotal, stableCustom));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Planner input</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Use tags like 0F-A for first questions and 1A / 2A for normal questions in category A.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInput((current) => !current)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 px-3 text-xs font-semibold text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {showInput ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {showInput ? 'Hide input' : 'Show input'}
          </button>
        </div>

        {showInput ? (
          <div className="mt-5 space-y-4">
            <div className="flex justify-center">
              <XToggleButton
                ariaLabel="Planner input mode"
                value={inputMode}
                onChange={(value) => applyInputMode(value as PlannerInputMode)}
                options={[
                  { value: 'ten', label: '10' },
                  { value: 'fourteen', label: '14' },
                  { value: 'twenty-six', label: '26' },
                  { value: 'custom', label: 'Custom' },
                ]}
                size="compact"
                className="max-w-full border-black/10 dark:border-white/10"
                minItemWidthClassName="min-w-[64px] sm:min-w-[88px]"
                itemPaddingClassName="px-4 py-2"
                itemTextClassName="text-sm"
                inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-4 py-3 dark:bg-white/5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Input result
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {inputMode === 'custom'
                      ? `Custom generated total ${displayedTotal}`
                      : `${activeQuickCase?.label ?? 'Preset'} preset`}
                  </div>
                </div>
                {inputMode === 'custom' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={stableCustom}
                      onClick={() => setStableCustom((current) => !current)}
                      className={cn(
                        'relative inline-flex h-8 w-24 items-center rounded-full border px-1 transition',
                        stableCustom
                          ? cn('border-transparent text-white', themeButtonGradientClass, themeButtonGradientHoverClass)
                          : themedGhostButtonClass
                      )}
                      title={stableCustom ? 'Stable generation enabled' : 'Random generation enabled'}
                    >
                      <span className={cn(
                        'absolute inset-y-0 flex items-center text-[10px] font-bold uppercase tracking-wide transition',
                        stableCustom
                          ? 'left-3'
                          : 'right-3 text-slate-600 dark:text-slate-200'
                      )}>
                        {stableCustom ? 'Stable' : 'Random'}
                      </span>
                      <span
                        className={cn(
                          'relative z-10 inline-block h-6 w-6 rounded-full bg-white shadow-sm transition dark:bg-slate-100',
                          stableCustom ? 'translate-x-16' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <label className="flex items-center rounded-full border border-black/10 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white">
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={customDraftTotal}
                        onChange={(event) => setCustomDraftTotal(event.target.value)}
                        onBlur={generateCustomInput}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                        className="h-5 w-14 bg-transparent text-center text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {inputFirstQuestions.map((question) => (
                    <QuestionTag key={`${question.id.toString()}-${question.code}`} question={question} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inputNormalQuestions.map((question) => (
                    <QuestionTag key={`${question.id.toString()}-${question.code}`} question={question} />
                  ))}
                </div>
              </div>
            </div>

            {activeQuickCase?.description ? (
              <div className="rounded-2xl bg-slate-50/80 p-3 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                {activeQuickCase.description}
              </div>
            ) : null}

            {invalidCodes.length > 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {`Invalid tags: ${invalidCodes.join(', ')}`}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['Total', questions.length],
            ['First', firstCount],
            ['Normal', normalCount],
            ['Categories', categoryCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50/80 p-4 text-center dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Planner output</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Each group should contain one 0F-* tag first, followed by four different normal categories.
            </div>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            {`${groups.length} groups`}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <div key={`group-${index}`} className="rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {`Group #${index + 1}`}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.map((question) => (
                    <QuestionTag key={`${index}-${question.code}`} question={question} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No complete group can be generated from the current input.
            </div>
          )}
        </div>

        {remainingQuestions.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              UNABLE MATCH IDS
            </div>
            <div className="flex flex-wrap gap-2">
              {remainingQuestions.map((question) => (
                <QuestionTag key={`remaining-${question.id.toString()}-${question.code}`} question={question} muted />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
