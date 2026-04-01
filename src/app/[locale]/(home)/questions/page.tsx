import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
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
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/random'),
          label: 'Random Sets',
          icon: <icons.BookOpen className="h-4 w-4" />
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
            idLabel: t('filters.id.label'),
            idPlaceholder: t('filters.id.placeholder'),
            uuidLabel: t('filters.uuid.label'),
            uuidPlaceholder: t('filters.uuid.placeholder'),
            firstLabel: t('filters.first.label'),
          },
          loading: t('status.loading'),
          loadFailed: t('status.loadFailed'),
          pagination: {
            summary: t.raw('pagination.summary'),
            previous: t('pagination.previous'),
            next: t('pagination.next'),
          },
          export: {
            settingsLabel: t('export.settings'),
            buttonLabel: t('export.button'),
            loadingLabel: t('export.loading'),
            dialogTitle: t('export.dialog.title'),
            dialogDescription: t('export.dialog.description'),
            confirm: t('export.dialog.confirm'),
            cancel: t('export.dialog.cancel'),
            requiredHint: t('export.dialog.requiredHint'),
            failed: t('export.status.failed'),
            columns: {
              id: t('export.columns.id'),
              questionUuid: t('export.columns.questionUuid'),
              category: t('export.columns.category'),
              subCategory: t('export.columns.subCategory'),
              asFirst: t('export.columns.asFirst'),
            },
          },
        }}
      />
    </QuestionPageShell>
  );
}
