import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionImportPageCopy } from '@/components/question-copy';
import { QuestionImportClient } from '@/components/question-import-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = await getQuestionImportPageCopy(locale);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: copy.actions.backToList,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: copy.actions.create,
          primary: true,
          icon: false
        },
      ]}
    >
      <QuestionImportClient copy={copy.client} />
    </QuestionPageShell>
  );
}
