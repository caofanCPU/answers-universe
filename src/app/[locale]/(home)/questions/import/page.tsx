import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { buildQuestionFormCopy, buildQuestionImportCopy } from '@/components/question-copy';
import { QuestionImportClient } from '@/components/question-import-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const createT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const formT = await getTranslations({ locale, namespace: 'faqPage.questionForm' });
  const formCopy = buildQuestionFormCopy(formT);
  const copy = buildQuestionImportCopy(t, t.raw, formCopy);

  return (
    <QuestionPageShell
      title={t('title')}
      description={t('description')}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: t('actions.backToList'),
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: createT('title'),
          primary: true,
          icon: false
        },
      ]}
    >
      <QuestionImportClient copy={copy} />
    </QuestionPageShell>
  );
}
