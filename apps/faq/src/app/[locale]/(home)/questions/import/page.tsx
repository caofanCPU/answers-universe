import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionImportPageCopy, getQuestionsListPageCopy } from '@/components/question-copy';
import { QuestionImportClient } from '@/components/question-import-client';
import { QuestionPageShell } from '@/components/question-page-shell';
import { getRandomQuestionsPageCopy } from '@/components/question-copy';

export default async function QuestionImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [copy, listCopy, randomCopy] = await Promise.all([
    getQuestionImportPageCopy(locale),
    getQuestionsListPageCopy(locale),
    getRandomQuestionsPageCopy(locale),
  ]);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: listCopy.title,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/random'),
          label: randomCopy.title,
          icon: false
        },
      ]}
    >
      <QuestionImportClient copy={copy.client} />
    </QuestionPageShell>
  );
}
