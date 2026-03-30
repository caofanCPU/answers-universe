import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const formT = await getTranslations({ locale, namespace: 'faqPage.questionForm' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

  return (
    <QuestionPageShell
      title={t('title')}
      description={t('description')}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: t('actions.backToList'),
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
        },
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="create"
        usb={{
          noticeCreate: t('notice'),
          noticeEdit: t('notice'),
          loading: t('status.loading'),
          submitFailed: t('status.submitFailed'),
          saving: t('status.saving'),
          createButton: t('actions.submit'),
          updateButton: t('actions.submit'),
          form: {
            question: formT('question'),
            answersLabel: formT('answers.label'),
            answersPlaceholder: formT('answers.placeholder'),
            answersEmpty: formT('answers.empty'),
            answersExpand: formT('answers.expand'),
            answersCollapse: formT('answers.collapse'),
            answersCorrectPrefix: formT('answers.correctPrefix'),
            answersNoCorrect: formT('answers.noCorrect'),
            categoryLabel: formT('category.label'),
            categoryEmpty: formT('category.empty'),
            subCategoryLabel: formT('subCategory.label'),
            subCategoryEmpty: formT('subCategory.empty'),
            difficultyLabel: formT('difficulty.label'),
            difficultyEmpty: formT('difficulty.empty'),
            tagsLabel: formT('tags.label'),
            tagsPlaceholder: formT('tags.placeholder'),
            tagsEmpty: formT('tags.empty'),
            explanation: formT('explanation'),
            cdnImagePrefix: formT('cdnImagePrefix'),
            questionImage: formT('questionImage'),
            asFirst: formT('asFirst'),
          },
        }}
      />
    </QuestionPageShell>
  );
}
