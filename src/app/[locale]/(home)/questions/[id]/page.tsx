import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { getTranslations } from 'next-intl/server';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'faqPage.questionDetail' });
  const formT = await getTranslations({ locale, namespace: 'faqPage.questionForm' });
  const editT = await getTranslations({ locale, namespace: 'faqPage.questionEdit' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

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
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: importT('title'),
        },
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="edit"
        id={id}
        initialPreviewOpen
        usb={{
          noticeCreate: editT('notice'),
          noticeEdit: editT('notice'),
          loading: editT('status.loading'),
          submitFailed: editT('status.submitFailed'),
          saving: editT('status.saving'),
          createButton: editT('actions.submit'),
          updateButton: editT('actions.submit'),
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
