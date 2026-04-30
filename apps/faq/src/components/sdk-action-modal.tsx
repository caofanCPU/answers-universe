'use client';

import type { ReactNode } from 'react';
import { XIcon } from '@windrun-huaiin/base-ui/icons';

type OuterClientActionModalProps = {
  open: boolean;
  title: string;
  titleMeta?: ReactNode;
  description?: string;
  resultOnly?: boolean;
  closeLabel: string;
  onClose: () => void;
  formContent: ReactNode;
  resultContent: ReactNode;
};

export function OuterClientActionModal({
  open,
  title,
  titleMeta,
  description,
  resultOnly = false,
  closeLabel,
  onClose,
  formContent,
  resultContent,
}: OuterClientActionModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 pb-4 pt-32 backdrop-blur-sm sm:px-4 sm:pb-6 sm:pt-36"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:max-h-[calc(100vh-11.5rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
              {titleMeta}
            </div>
            {description ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-black/5 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label={closeLabel}
            title={closeLabel}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-3 sm:gap-4">
            {resultOnly ? resultContent : formContent}
          </div>
        </div>
      </div>
    </div>
  );
}
