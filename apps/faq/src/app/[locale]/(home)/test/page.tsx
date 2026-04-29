import Link from 'next/link';
import { QuestionPageShell } from '@/components/question-page-shell';

export default function TestIndexPage() {
  return (
    <QuestionPageShell
      title="Test Workbench"
      description="Internal visual test pages."
    >
      <div className="min-h-[calc(100vh-16rem)]">
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <Link
            href="./test/sdk"
            className="h-full rounded-3xl border border-black/10 p-5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white">SDK Test</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Simulate a third-party server integration that calls FAQ Base through the SDK.
            </div>
          </Link>
          <Link
            href="./test/abc"
            className="h-full rounded-3xl border border-black/10 p-5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Random Planner Test</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Visualize random question planner input and output groups.
            </div>
          </Link>
        </div>
      </div>
    </QuestionPageShell>
  );
}
