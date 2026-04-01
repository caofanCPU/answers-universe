import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { RandomQuestionBoardClient } from '@/components/random-question-board-client';
import { QuestionPageShell } from '@/components/question-page-shell';
import { getTranslations } from 'next-intl/server';

export default async function RandomQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionsList' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

  return (
    <QuestionPageShell
      title="Random Question Sets"
      description="Generate daily random question sets, inspect saved dates, and regenerate a day when the pool changes."
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: 'Back to List',
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: t('actions.create'),
          primary: true,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
          icon: false
        },
      ]}
    >
      <RandomQuestionBoardClient locale={locale} />
    </QuestionPageShell>
  );
}
