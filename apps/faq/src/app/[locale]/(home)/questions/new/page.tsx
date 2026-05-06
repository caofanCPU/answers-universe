import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionsListPageCopy } from '@/components/question-copy';
import { getQuestionCreatePageCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [copy, listCopy] = await Promise.all([
    getQuestionCreatePageCopy(locale),
    getQuestionsListPageCopy(locale),
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
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: copy.actions.primary,
          primary: true,
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
        mode="create"
        usb={copy.editor}
      />
    </QuestionPageShell>
  );
}
