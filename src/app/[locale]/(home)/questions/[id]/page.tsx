import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { QuestionDetailClient } from '@/components/question-detail-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionDetail' });

  return (
    <QuestionPageShell
      title={t('title', { id })}
      description={t('description')}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: t('actions.backToList'),
        },
        {
          href: getAsNeededLocalizedUrl(locale, `/questions/${id}/edit`),
          label: t('actions.edit'),
          primary: true,
        },
      ]}
    >
      <QuestionDetailClient locale={locale} id={id} />
    </QuestionPageShell>
  );
}
