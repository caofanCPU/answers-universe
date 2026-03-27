import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
    <QuestionPageShell
      title={locale === 'zh' ? `编辑题目 #${id}` : `Edit Question #${id}`}
      description={
        locale === 'zh'
          ? '编辑页现已接入详情加载和更新接口。当前可以先加载题目内容，再编辑并跳转回详情页。'
          : 'The edit page is now connected to detail loading and the update API. It loads the question first, then lets you edit and return to the detail page.'
      }
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, `/questions/${id}`),
          label: locale === 'zh' ? '返回详情' : 'Back to Detail',
        },
      ]}
    >
      <QuestionEditorClient locale={locale} mode="edit" id={id} />
    </QuestionPageShell>
  );
}
