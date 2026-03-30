import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { QuestionListClient } from '@/components/question-list-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionsList' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

  return (
    <QuestionPageShell
      title={t('title')}
      description={t('description')}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: t('actions.create'),
          primary: true,
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
        },
      ]}
    >
      <QuestionListClient
        locale={locale}
        copy={{
          filters: {
            categoryLabel: t('filters.category.label'),
            categoryAll: t('filters.category.all'),
            subCategoryLabel: t('filters.subCategory.label'),
            subCategoryAll: t('filters.subCategory.all'),
            difficultyLabel: t('filters.difficulty.label'),
            difficultyAll: t('filters.difficulty.all'),
          },
          loading: t('status.loading'),
          loadFailed: t('status.loadFailed'),
          pagination: {
            summary: t.raw('pagination.summary'),
            previous: t('pagination.previous'),
            next: t('pagination.next'),
          },
        }}
      />
    </QuestionPageShell>
  );
}
