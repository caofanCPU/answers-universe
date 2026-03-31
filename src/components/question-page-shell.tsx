import Link from 'next/link';

type ShellAction = {
  href: string;
  label: string;
  primary?: boolean;
};

type QuestionPageShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: ShellAction[];
};

export function QuestionPageShell({
  title,
  description,
  children,
  actions = [],
}: QuestionPageShellProps) {
  return (
    <section className="mx-auto mt-12 flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8 lg:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
            {description}
          </p>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={
                  action.primary
                    ? 'inline-flex items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110'
                    : 'inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5'
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="w-full min-w-0">{children}</div>
    </section>
  );
}
