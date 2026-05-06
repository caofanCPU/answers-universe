import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionCreatePageCopy, getQuestionEditPageCopy, getQuestionImportPageCopy, getQuestionsListPageCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [copy, listCopy, createCopy, importCopy] = await Promise.all([
    getQuestionEditPageCopy(locale, id),
    getQuestionsListPageCopy(locale),
    getQuestionCreatePageCopy(locale),
    getQuestionImportPageCopy(locale),
  ]);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: listCopy.title,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: createCopy.title,
          primary: true,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importCopy.title,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/random'),
          label: listCopy.actions.randomSets,
          icon: false
        },
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="edit"
        id={id}
        usb={copy.editor}
      />
    </QuestionPageShell>
  );
}
