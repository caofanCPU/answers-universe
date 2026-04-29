import { QuestionPageShell } from '@/components/question-page-shell';
import { RandomQuestionPlannerTestClient } from './random-question-planner-test-client';

export default function RandomPlannerTestPage() {
  return (
    <QuestionPageShell
      title="Random Planner Test"
      description="Visualize random question planner input and output groups."
    >
      <div className="min-h-[calc(100vh-16rem)]">
        <RandomQuestionPlannerTestClient />
      </div>
    </QuestionPageShell>
  );
}
