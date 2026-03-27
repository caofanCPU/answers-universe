import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionDetailClient } from '@/components/question-detail-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
    <QuestionPageShell
      title={locale === 'zh' ? `题目详情 #${id}` : `Question Detail #${id}`}
      description={
        locale === 'zh'
          ? '题目详情页现已接入详情接口。当前可以查看题干、选项、答案显隐、解析和右侧元信息。'
          : 'The question detail page is now connected to the detail API. It currently supports question content, option display, answer reveal, explanation and right-side meta information.'
      }
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: locale === 'zh' ? '返回列表' : 'Back to List',
        },
        {
          href: getAsNeededLocalizedUrl(locale, `/questions/${id}/edit`),
          label: locale === 'zh' ? '编辑题目' : 'Edit Question',
          primary: true,
        },
      ]}
    >
      <QuestionDetailClient locale={locale} id={id} />
    </QuestionPageShell>
  );
}
