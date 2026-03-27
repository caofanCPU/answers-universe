import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <QuestionPageShell
      title={locale === 'zh' ? '录入题目' : 'Create Question'}
      description={
        locale === 'zh'
          ? '录入页现已接入创建接口。当前可以填写表单、实时预览，并在保存后跳转到新建题目的详情页。'
          : 'The create page is now connected to the create API. You can edit the form, preview the result live, and redirect to the new detail page after saving.'
      }
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: locale === 'zh' ? '返回列表' : 'Back to List',
        },
      ]}
    >
      <QuestionEditorClient locale={locale} mode="create" />
    </QuestionPageShell>
  );
}
