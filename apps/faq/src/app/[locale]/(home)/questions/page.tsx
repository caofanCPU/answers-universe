import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionsListPageCopy } from '@/components/question-copy';
import { QuestionListClient } from '@/components/question-list-client';
import { QuestionPageShell } from '@/components/question-page-shell';
import { appConfig } from '@/lib/appConfig';
import { createLocalizedMetadata } from '@windrun-huaiin/third-ui/lib/seo-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return createLocalizedMetadata({
    namespace: 'metadata.questions',
    url: {
      locale,
      pathname: '/questions',
      baseUrl: appConfig.baseUrl,
      locales: appConfig.i18n.locales,
      defaultLocale: appConfig.i18n.defaultLocale,
      localePrefixAsNeeded: appConfig.i18n.localePrefixAsNeeded,
    },
  });
}

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
      ]}
    >
      <QuestionListClient locale={locale} copy={copy.client} />
    </QuestionPageShell>
  );
}
