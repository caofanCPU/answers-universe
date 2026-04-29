import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getQuestionDetailPageCopy } from '@/components/question-copy';
import { QuestionEditorClient } from '@/components/question-editor-client';
import { QuestionPageShell } from '@/components/question-page-shell';

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const copy = await getQuestionDetailPageCopy(locale, id);

  return (
    <QuestionPageShell
      title={copy.title}
      description={copy.description}
      actions={[
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/import'),
          label: copy.actions.primary,
          primary: true,
          icon: false
        },
        {
          href: getAsNeededLocalizedUrl(locale, '/questions/new'),
          label: copy.actions.secondary!,
          icon: false
        },
      ]}
    >
      <QuestionEditorClient
        locale={locale}
        mode="edit"
        id={id}
        initialPreviewOpen
        backHref={getAsNeededLocalizedUrl(locale, '/questions')}
        backLabel={copy.backLabel}
        usb={copy.editor}
      />
    </QuestionPageShell>
  );
}
