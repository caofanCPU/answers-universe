import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionsListPageCopy } from '@/components/question-copy';
import { QuestionListClient } from '@/components/question-list-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = await getQuestionsListPageCopy(locale);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: copy.actions.create,
          primary: true,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: copy.actions.import,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/random'),
          label: copy.actions.randomSets,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/clients'),
          label: copy.actions.clients,
          icon: false
        },
      ]}
    >
      <QuestionListClient locale={locale} copy={copy.client} />
    </QuestionPageShell>
  );
}
