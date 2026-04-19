'use client';

import type { ReactNode } from 'react';
import { XIcon } from '@windrun-huaiin/base-ui/icons';

type OuterClientActionModalProps = {
  open: boolean;
  title: string;
  description?: string;
  closeLabel: string;
  onClose: () => void;
  formContent: ReactNode;
  resultContent: ReactNode;
};

export function OuterClientActionModal({
  open,
  title,
  description,
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-3 pb-4 pt-32 backdrop-blur-sm sm:px-4 sm:items-center sm:py-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(88vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10 sm:gap-4 sm:px-6 sm:py-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label={closeLabel}
            title={closeLabel}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            {formContent}
            {resultContent}
          </div>
        </div>
      </div>
    </div>
  );
}
