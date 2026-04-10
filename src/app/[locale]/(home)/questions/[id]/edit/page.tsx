import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { buildQuestionEditorCopy, buildQuestionFormCopy, buildQuestionPreviewCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionEdit' });
  const formT = await getTranslations({ locale, namespace: 'faqPage.questionForm' });
  const listT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const previewT = await getTranslations({ locale, namespace: 'faqPage.questionPreview' });
  const formCopy = buildQuestionFormCopy(formT);
  const previewCopy = buildQuestionPreviewCopy(previewT);
  const editorCopy = buildQuestionEditorCopy(t, formCopy, previewCopy);

  return (
    <QuestionPageShell
      title={t('title', { id })}
      description={t('description')}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: listT('title'),
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
          primary: true,
          icon: false
        },
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="edit"
        id={id}
        backHref={getAsNeededLocalizedUrl(locale, '/questions')}
        backLabel={listT('actions.backToList')}
        usb={editorCopy}
      />
    </QuestionPageShell>
  );
}
