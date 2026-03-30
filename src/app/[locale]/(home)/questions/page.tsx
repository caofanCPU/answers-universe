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
        }}
      />
    </QuestionPageShell>
  );
}
