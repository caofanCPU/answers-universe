import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBorderColor, themeIconColor, themeRingColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

type InfoTooltipProps = {
  content: string;
  className?: string;
  contentClassName?: string;
};

export function InfoTooltip({
  content,
  className,
  contentClassName,
}: InfoTooltipProps) {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    return null;
  }

  return (
    <span className={cn('relative inline-flex shrink-0 align-middle', className)}>
      <button
        type="button"
        className={cn(
          'peer inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition',
          'hover:bg-black/5 hover:dark:bg-white/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950',
          'hover:text-slate-700 dark:hover:text-white focus-visible:text-slate-700 dark:focus-visible:text-white',
          themeIconColor,
          themeRingColor,
        )}
        aria-label={normalizedContent}
      >
        <icons.CircleQuestionMark className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden w-72 -translate-y-1/2 rounded-2xl border bg-white/95 px-3 py-2 text-xs leading-5 text-slate-600 shadow-xl backdrop-blur-sm peer-hover:block peer-focus-visible:block dark:bg-slate-950/95 dark:text-slate-300',
          themeBorderColor,
          contentClassName,
        )}
        role="tooltip"
      >
        {normalizedContent}
      </span>
    </span>
  );
}
