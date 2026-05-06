import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionEditPageCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const copy = await getQuestionEditPageCopy(locale, id);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: copy.actions.primary,
          primary: true,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: copy.actions.secondary!,
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
