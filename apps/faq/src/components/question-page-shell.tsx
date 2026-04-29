import { GradientButton } from '@windrun-huaiin/third-ui/main/buttons';
import { InfoTooltip } from '@windrun-huaiin/third-ui/main';

type ShellAction = {
  href: string;
  label: string;
  icon?: React.ReactNode;
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
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {title}
            </h1>
            <InfoTooltip content={description} align="start" desktopSide="bottom" />
          </div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <GradientButton
                key={`${action.href}-${action.label}`}
                href={action.href}
                title={action.label}
                icon={action.icon}
                openInNewTab={false}
                align="center"
                className="w-full sm:w-[148px]"
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="w-full min-w-0">{children}</div>
    </section>
  );
}
