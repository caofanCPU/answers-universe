import { QuestionPageShell } from '@/components/question-page-shell';
import { OuterClientsClient } from '@/components/sdk-list-client';
import { getOuterClientsPageCopy } from '@/components/sdk-copy';

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
    >
      <OuterClientsClient locale={locale} copy={copy.client} />
    </QuestionPageShell>
  );
}
