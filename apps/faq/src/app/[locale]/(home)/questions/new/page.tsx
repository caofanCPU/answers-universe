import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionCreatePageCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = await getQuestionCreatePageCopy(locale);

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
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="create"
        backHref={getAsNeededLocalizedUrl(locale, '/questions')}
        backLabel={copy.backLabel}
        usb={copy.editor}
      />
    </QuestionPageShell>
  );
}
