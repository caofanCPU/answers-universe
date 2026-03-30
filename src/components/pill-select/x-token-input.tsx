'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { themeBgColor, themeBorderColor, themeIconColor, themeRingColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

type XTokenInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  maxPillWidthClassName?: string;
};

function sanitizeToken(value: string): string {
  return value.replaceAll(',', '').trim();
}

function dedupeTokens(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => sanitizeToken(item)).filter(Boolean)));
}

export function XTokenInput({
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled = false,
  className,
  maxPillWidthClassName = 'max-w-[180px] sm:max-w-[220px]',
}: XTokenInputProps) {
  const [draftValue, setDraftValue] = useState('');
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tokens = dedupeTokens(value);

  function commitToken(rawValue: string) {
    if (disabled) {
      return;
    }

    const nextValue = sanitizeToken(rawValue);
    if (!nextValue) {
      setDraftValue('');
      return;
    }

    onChange(dedupeTokens([...tokens, nextValue]));
    setDraftValue('');
  }

  function removeToken(target: string) {
    if (disabled) {
      return;
    }

    onChange(tokens.filter((item) => item !== target));
    inputRef.current?.focus();
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        ref={rootRef}
        onClick={() => inputRef.current?.focus()}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
            return;
          }

          setFocused(false);
        }}
        className={cn(
          'min-h-11 rounded-3xl border border-black/10 bg-white px-3 py-2.5 transition dark:border-white/10 dark:bg-slate-950',
          focused && themeBorderColor
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {tokens.length > 0 ? (
            <ul className="contents" role="list">
              {tokens.map((token) => (
                <li key={token} className="list-none">
                  <span
                    className={cn(
                      'inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition',
                      themeBgColor,
                      themeIconColor,
                      disabled && 'opacity-60'
                    )}
                    title={token}
                  >
                    <span className={cn('truncate', maxPillWidthClassName)}>{token}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeToken(token);
                      }}
                      disabled={disabled}
                      aria-label={`Remove ${token}`}
                      className={cn(
                        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition',
                        'hover:bg-black/10 dark:hover:bg-white/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                        themeRingColor,
                        disabled && 'cursor-not-allowed'
                      )}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div
            className={cn(
              'flex-1',
              tokens.length === 0 ? 'min-w-[160px]' : draftValue || focused ? 'min-w-[96px]' : 'min-w-0'
            )}
          >
            <input
              ref={inputRef}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value.replaceAll(',', ''))}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !draftValue && tokens.length > 0) {
                  event.preventDefault();
                  removeToken(tokens[tokens.length - 1]);
                  return;
                }

                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                commitToken(draftValue);
              }}
              disabled={disabled}
              placeholder={tokens.length === 0 ? placeholder : undefined}
              className={cn(
                'bg-transparent px-1 py-1 text-sm text-slate-700 outline-none dark:text-white',
                tokens.length === 0 || draftValue || focused ? 'w-full' : 'w-0'
              )}
            />
          </div>
        </div>
      </div>
      {tokens.length === 0 && emptyLabel ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</div>
      ) : null}
    </div>
  );
}
