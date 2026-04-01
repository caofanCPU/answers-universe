import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { RandomQuestionBoardClient } from '@/components/random-question-board-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function RandomQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <QuestionPageShell
      title="Random Question Sets"
      description="Generate daily random question sets, inspect saved dates, and regenerate a day when the pool changes."
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions'),
          label: 'Question List',
          icon: <icons.BookCheck className="h-4 w-4" />,
        },
      ]}
    >
      <RandomQuestionBoardClient locale={locale} />
    </QuestionPageShell>
  );
}
