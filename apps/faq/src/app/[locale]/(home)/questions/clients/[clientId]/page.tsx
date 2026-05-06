import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { QuestionPageShell } from '@/components/question-page-shell';
import { OuterClientDetailClient } from '@/components/sdk-detail-client';
import { getOuterClientDetailPageCopy } from '@/components/sdk-copy';

export default async function OuterClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const { locale, clientId } = await params;
  const copy = await getOuterClientDetailPageCopy(locale);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/clients'),
          label: copy.actions.backToClients,
          icon: false,
        },
      ]}
    >
      <OuterClientDetailClient clientId={clientId} copy={copy.client} />
    </QuestionPageShell>
  );
}
