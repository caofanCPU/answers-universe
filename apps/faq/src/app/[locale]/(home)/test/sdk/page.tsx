import { QuestionPageShell } from '@/components/question-page-shell';
import { SdkTestClient } from '@/components/sdk-test-client';

export default function SdkTestPage() {
  return (
    <QuestionPageShell
      title="SDK Test"
      description="Simulate a third-party server integration that calls FAQ Base through @windrun-huaiin/faq-sdk."
    >
      <div className="min-h-[calc(100vh-16rem)]">
        <SdkTestClient />
      </div>
    </QuestionPageShell>
  );
}
