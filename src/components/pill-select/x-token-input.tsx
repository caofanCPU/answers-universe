'use client';

import { useRef, useState } from 'react';
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
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'min-h-11 rounded-3xl border border-black/10 bg-white px-3 py-2.5 transition dark:border-white/10 dark:bg-slate-950',
          themeBorderColor,
          themeRingColor,
          'focus-within:ring-4'
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeToken(token);
              }}
              disabled={disabled}
              className={cn(
                'inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold transition',
                themeBgColor,
                themeIconColor,
                'hover:brightness-95 dark:hover:brightness-110',
                disabled && 'cursor-not-allowed opacity-60'
              )}
              title={token}
            >
              <span className={cn('truncate', maxPillWidthClassName)}>{token}</span>
            </button>
          ))}
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
              tokens.length === 0 ? 'min-w-[220px] flex-1' : draftValue ? 'min-w-[96px] flex-1' : 'w-6 flex-none'
            )}
          />
        </div>
      </div>
      {tokens.length === 0 && emptyLabel ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</div>
      ) : null}
    </div>
  );
}
