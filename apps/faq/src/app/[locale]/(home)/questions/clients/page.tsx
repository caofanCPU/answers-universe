import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { QuestionPageShell } from '@/components/question-page-shell';
import { OuterClientsClient } from '@/components/outer-clients-client';
import { getOuterClientsPageCopy } from '@/components/outer-client-copy';

export default async function OuterClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = await getOuterClientsPageCopy(locale);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: copy.actions.backToQuestions,
          icon: false,
        },
      ]}
    >
      <OuterClientsClient locale={locale} copy={copy.client} />
    </QuestionPageShell>
  );
}
