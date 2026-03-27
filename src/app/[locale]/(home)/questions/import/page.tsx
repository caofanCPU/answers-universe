import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionImportClient } from '@/components/question-import-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <QuestionPageShell
      title={locale === 'zh' ? 'JSON 批量导入' : 'JSON Import'}
      description={
        locale === 'zh'
          ? '第一步只做前端本地解析与预览，不发后端请求。确认本地解析结果和预览结构没问题后，再进入后端批量校验与批量入库。'
          : 'Step one only covers frontend-local JSON parsing and preview. No backend request is sent yet. Once the local preview format is confirmed, the next step will add backend validation and batch commit.'
      }
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: locale === 'zh' ? '返回列表' : 'Back to List',
        },
      ]}
    >
      <QuestionImportClient locale={locale} />
    </QuestionPageShell>
  );
}
