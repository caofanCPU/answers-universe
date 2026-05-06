export function QuestionListSkeleton() {
  const cards = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div
      className="grid min-h-[560px] content-start gap-5 pt-1 sm:gap-6 sm:pt-1"
      aria-busy="true"
      aria-live="polite"
    >
      {cards.map((card) => (
        <div
          key={card}
          className="relative overflow-hidden rounded-3xl border border-black/10 px-4 pb-4 pt-5 dark:border-white/10 sm:px-4.5 sm:pt-5.5 md:pt-4"
        >
          <div className="absolute left-1/2 top-0 h-7 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-slate-100 dark:border-white/10 dark:bg-white/5" />
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-8 w-full max-w-md rounded-full bg-slate-100 dark:bg-white/5" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-white/5" />
                <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
                <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-full rounded-full bg-slate-100 dark:bg-white/5" />
                <div className="h-5 w-11/12 rounded-full bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="h-5 w-2/5 rounded-full bg-slate-100 dark:bg-white/5" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-14 rounded-full border border-black/10 dark:border-white/10" />
                <div className="h-5 w-20 rounded-full border border-black/10 dark:border-white/10" />
                <div className="h-5 w-16 rounded-full border border-black/10 dark:border-white/10" />
              </div>
            </div>
            <div className="flex justify-end gap-2 md:shrink-0">
              <div className="h-8 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
              <div className="h-8 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
              <div className="h-8 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionDetailSkeleton() {
  return (
    <div className="grid min-h-[560px] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6 rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <div className="space-y-3">
          <div className="h-8 w-2/5 rounded-full bg-slate-100 dark:bg-white/5" />
          <div className="h-5 w-full rounded-full bg-slate-100 dark:bg-white/5" />
          <div className="h-5 w-5/6 rounded-full bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="rounded-3xl border border-dashed border-slate-300 p-8 dark:border-white/10">
          <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-white/5" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-white/5" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-white/5" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <div className="h-6 w-1/2 rounded-full bg-slate-100 dark:bg-white/5" />
        <div className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5" />
        <div className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5" />
        <div className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5" />
      </div>
    </div>
  );
}

export function QuestionEditorSkeleton({ mode }: { mode: 'create' | 'edit' }) {
  return (
    <div className="grid min-h-[560px] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-5 rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {mode === 'create' ? 'Create' : 'Edit'}
          </div>
          <div className="mt-2 h-10 rounded-xl border border-dashed border-slate-300 dark:border-white/10" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-10 rounded-xl border border-dashed border-slate-300 dark:border-white/10" />
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-10 rounded-xl border border-dashed border-slate-300 dark:border-white/10" />
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="h-4 w-1/4 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-36 rounded-2xl border border-dashed border-slate-300 dark:border-white/10" />
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="h-4 w-1/4 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-24 rounded-2xl border border-dashed border-slate-300 dark:border-white/10" />
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">Preview</div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
            Placeholder
          </span>
        </div>
        <div className="h-6 w-2/3 rounded-full bg-slate-100 dark:bg-white/5" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5" />
        <div className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5" />
        <div className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5" />
        <div className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5" />
      </div>
    </div>
  );
}
