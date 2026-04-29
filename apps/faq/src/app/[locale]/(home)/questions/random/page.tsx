import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { RandomQuestionBoardClient } from '@/components/random-question-board-client';
import { getRandomQuestionsPageCopy } from '@/components/question-copy';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function RandomQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = await getRandomQuestionsPageCopy(locale);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: copy.actions.backToList,
          icon: false
        },
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
      ]}
    >
      <RandomQuestionBoardClient locale={locale} />
    </QuestionPageShell>
  );
}
