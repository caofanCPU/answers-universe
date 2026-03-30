'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { globalLucideIcons as icons, createSiteIcon} from '@windrun-huaiin/base-ui/components/server';
import { themeBorderColor, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

const EyeIcon = createSiteIcon(Eye);
const EyeOffIcon = createSiteIcon(EyeOff);

export type QuestionAnswerOptionDraft = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuestionAnswerOptionsProps = {
  options: QuestionAnswerOptionDraft[];
  onChange?: (options: QuestionAnswerOptionDraft[]) => void;
  copy: {
    placeholder: string;
    empty: string;
    expand: string;
    collapse: string;
    correctPrefix: string;
    noCorrect: string;
  };
  readOnly?: boolean;
  showCorrectState?: boolean;
  className?: string;
};

function sanitizeAnswerText(value: string): string {
  return value.trim();
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function createAnswerOptionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAnswerLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function buildAnswerOptionDrafts(
  correctAnswer: string,
  incorrectAnswers: string[]
): QuestionAnswerOptionDraft[] {
  const correct = sanitizeAnswerText(correctAnswer);
  const incorrect = incorrectAnswers.map(sanitizeAnswerText).filter(Boolean);

  return [
    ...(correct ? [{ id: 'correct-0', text: correct, isCorrect: true }] : []),
    ...incorrect.map((text, index) => ({
      id: `incorrect-${index}-${text}`,
      text,
      isCorrect: false,
    })),
  ];
}

export function splitAnswerOptionDrafts(options: QuestionAnswerOptionDraft[]): {
  correctAnswer: string;
  incorrectAnswers: string[];
} {
  const normalized = options.map((option) => ({
    ...option,
    text: sanitizeAnswerText(option.text),
  })).filter((option) => option.text);

  const selectedCorrect = normalized.find((option) => option.isCorrect) ?? normalized[0];

  if (!selectedCorrect) {
    return {
      correctAnswer: '',
      incorrectAnswers: [],
    };
  }

  return {
    correctAnswer: selectedCorrect.text,
    incorrectAnswers: normalized.filter((option) => option.id !== selectedCorrect.id).map((option) => option.text),
  };
}

export function buildReadonlyAnswerOptions(
  correctAnswer: string,
  incorrectAnswers: string[],
  seed: string
): QuestionAnswerOptionDraft[] {
  return buildAnswerOptionDrafts(correctAnswer, incorrectAnswers)
    .map((option) => ({
      ...option,
      sortKey: hashString(`${seed}-${option.id}-${option.text}`),
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ sortKey: _sortKey, ...option }) => option);
}

export function QuestionAnswerOptions({
  options,
  onChange,
  copy,
  readOnly = false,
  showCorrectState = false,
  className,
}: QuestionAnswerOptionsProps) {
  const [draftValue, setDraftValue] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const correctOption = options.find((option) => option.isCorrect) ?? null;
  const correctOptionIndex = correctOption ? options.findIndex((option) => option.id === correctOption.id) : -1;

  function emit(nextOptions: QuestionAnswerOptionDraft[]) {
    onChange?.(nextOptions);
  }

  function addOption(rawValue: string) {
    const nextText = sanitizeAnswerText(rawValue);

    if (!nextText || readOnly) {
      setDraftValue('');
      return;
    }

    const nextOption: QuestionAnswerOptionDraft = {
      id: createAnswerOptionId(),
      text: nextText,
      isCorrect: options.length === 0 || !options.some((option) => option.isCorrect),
    };

    emit([...options, nextOption]);
    setDraftValue('');
    inputRef.current?.focus();
  }

  function removeOption(targetId: string) {
    if (readOnly) {
      return;
    }

    const nextOptions = options.filter((option) => option.id !== targetId);

    if (nextOptions.length > 0 && !nextOptions.some((option) => option.isCorrect)) {
      nextOptions[0] = {
        ...nextOptions[0],
        isCorrect: true,
      };
    }

    emit(nextOptions);
    inputRef.current?.focus();
  }

  function markCorrect(targetId: string) {
    if (readOnly) {
      return;
    }

    emit(
      options.map((option) => ({
        ...option,
        isCorrect: option.id === targetId,
      }))
    );
  }

  function moveOption(sourceId: string, targetId: string) {
    if (readOnly || sourceId === targetId) {
      return;
    }

    const sourceIndex = options.findIndex((option) => option.id === sourceId);
    const targetIndex = options.findIndex((option) => option.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const nextOptions = [...options];
    const [sourceOption] = nextOptions.splice(sourceIndex, 1);
    nextOptions.splice(targetIndex, 0, sourceOption);
    emit(nextOptions);
  }

  return (
    <div className={cn(className)}>
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-950">
        {!readOnly ? (
          <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
            <input
              ref={inputRef}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                addOption(draftValue);
              }}
              placeholder={copy.placeholder}
              className="min-h-6 w-full bg-transparent text-sm text-slate-700 outline-none dark:text-white"
            />
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
              aria-label={collapsed ? copy.expand : copy.collapse}
            >
              {collapsed ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            'flex items-center justify-end gap-3 border-t border-black/10 px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400',
            readOnly && 'border-t-0'
          )}
        >
          <span className="truncate">
            {correctOptionIndex >= 0 ? `${copy.correctPrefix} ${getAnswerLabel(correctOptionIndex)}` : copy.noCorrect}
          </span>
        </div>

        {!collapsed ? (
          <div className="border-t border-black/10 p-3 dark:border-white/10">
            {options.length > 0 ? (
              <div className="grid gap-2">
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    draggable={!readOnly}
                    onDragStart={() => setDraggingId(option.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(event) => {
                      if (readOnly) {
                        return;
                      }

                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (!draggingId) {
                        return;
                      }

                      moveOption(draggingId, option.id);
                      setDraggingId(null);
                    }}
                    className={cn(
                      'flex min-h-9 items-center gap-2 rounded-2xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                      option.isCorrect && showCorrectState && [themeBorderColor, themeIconColor],
                      !readOnly && draggingId === option.id && 'opacity-60'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!readOnly ? (
                          <button
                            type="button"
                            onClick={() => markCorrect(option.id)}
                            className={cn(
                              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 transition dark:border-white/10',
                              option.isCorrect && [themeBorderColor, themeIconColor]
                            )}
                            aria-label={`Mark option ${getAnswerLabel(index)} as correct`}
                          >
                            {option.isCorrect ? <icons.Check className="h-3.5 w-3.5" /> : <icons.Circle className="h-3.5 w-3.5" />}
                          </button>
                        ) : showCorrectState ? (
                          <span
                            className={cn(
                              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10',
                              option.isCorrect && [themeBorderColor, themeIconColor]
                            )}
                          >
                            {option.isCorrect ? (
                              <icons.Check className="h-3.5 w-3.5" />
                            ) : (
                              <icons.Circle className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </span>
                        ) : null}
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {getAnswerLabel(index)}.
                        </span>
                        <span className="truncate">{option.text}</span>
                      </div>
                    </div>
                    {!readOnly ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-full text-slate-400">
                          <icons.GripVertical className="h-3.5 w-3.5" />
                        </span>
                        <button
                          type="button"
                          onClick={() => removeOption(option.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                          aria-label={`Remove option ${getAnswerLabel(index)}`}
                        >
                          <icons.X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : copy.empty ? (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-2.5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {copy.empty}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
