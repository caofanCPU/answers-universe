import Link from 'next/link';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { GradientButton } from '@windrun-huaiin/third-ui/fuma/mdx';

const heroCopy = {
  en: {
    title: 'Build and manage your question bank',
    accent: 'with one clean workflow',
    description:
      'Create, preview, browse and edit questions in one place. Start with single-question management first, then extend into batch import and cache acceleration.',
    primary: 'Browse Questions',
    secondary: 'Create Question',
    about: 'Single-question flow first, batch import follows next',
    stats: [
      { label: 'Entry', value: 'List / Detail' },
      { label: 'Authoring', value: 'Create / Edit' },
      { label: 'Preview', value: 'Live Preview' },
    ],
  },
  zh: {
    title: '统一管理你的题库内容',
    accent: '先把单题主流程跑通',
    description:
      '围绕录入、预览、列表、详情和编辑建立题库基础能力。先把单题流程打通，后续再补 JSON 批量导入与缓存加速。',
    primary: '查看题目列表',
    secondary: '录入新题目',
    about: '先完成单题闭环，再扩展批量与缓存能力',
    stats: [
      { label: '入口', value: '列表 / 详情' },
      { label: '录题', value: '新建 / 编辑' },
      { label: '预览', value: '实时预览' },
    ],
  },
} as const;

export async function Hero({ locale }: { locale: string }) {
  const copy = locale === 'zh' ? heroCopy.zh : heroCopy.en;
  const questionsHref = getAsNeededLocalizedUrl(locale, '/questions');
  const newQuestionHref = getAsNeededLocalizedUrl(locale, '/questions/new');

  return (
    <section className="mx-auto mt-12 flex max-w-6xl flex-col gap-10 px-4 py-8 md:flex-row md:items-center md:gap-12">
      <div className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <icons.BookOpen className="h-3.5 w-3.5" />
          <span>Question Workspace</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-6xl dark:text-white">
          {copy.title}
          <br />
          <span className="bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            {copy.accent}
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          {copy.description}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <GradientButton title={copy.primary} href={questionsHref} align="center" />
          <Link
            href={newQuestionHref}
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {copy.secondary}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <icons.Zap className="h-4 w-4" />
          <span>{copy.about}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-purple-500/10 dark:border-white/10 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Question Flow
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">
                Single-question first
              </div>
            </div>
            <div className="rounded-full bg-linear-to-r from-purple-400 to-pink-600 p-3 text-white">
              <icons.Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {copy.stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-purple-300/60 bg-linear-to-r from-purple-50 to-pink-50 p-4 text-sm text-slate-700 dark:border-purple-400/30 dark:from-purple-500/10 dark:to-pink-500/10 dark:text-slate-200">
            <div className="font-semibold">Current build order</div>
            <div className="mt-2">Backend CRUD {'->'} Single-question pages {'->'} JSON import {'->'} Redis + QStash</div>
          </div>
        </div>
      </div>
    </section>
  );
}
