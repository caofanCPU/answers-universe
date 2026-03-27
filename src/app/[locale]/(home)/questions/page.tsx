import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionListClient } from '@/components/question-list-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <QuestionPageShell
      title={locale === 'zh' ? '题目列表' : 'Questions'}
      description={
        locale === 'zh'
          ? '题目列表页现已接入列表 API。当前支持关键词、分类、难度和标签筛选，分页与更细的查询体验后续再补。'
          : 'The questions index is now connected to the list API. Keyword, category, difficulty and tag filters are active. Pagination refinements can follow later.'
      }
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: locale === 'zh' ? '录入新题目' : 'Create Question',
          primary: true,
        },
      ]}
    >
      <QuestionListClient locale={locale} />
    </QuestionPageShell>
  );
}
