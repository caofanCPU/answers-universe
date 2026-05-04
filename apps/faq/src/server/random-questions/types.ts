import type { QuestionDetailDto } from '@/server/questions/types';

export type RandomQuestionReason = 'NO_FIRST_QUESTION_AVAILABLE' | 'NOT_ENOUGH_NORMAL_QUESTIONS_AVAILABLE';

export type RandomQuestionDraftItem = {
  questionId: string;
  questionUuid: string;
  asFirst: number;
  category: string;
  sortOrder: number;
};

export type RandomQuestionPreviewItem = RandomQuestionDraftItem & {
  question: QuestionDetailDto | null;
};

export type RandomQuestionPreviewStats = {
  targetTotal: number;
  actualTotal: number;
  targetFirstCount: number;
  actualFirstCount: number;
  targetNormalCount: number;
  actualNormalCount: number;
};

export type RandomQuestionPreviewResult = {
  showDate: string;
  targetCount: number;
  canCommit: boolean;
  reasons: RandomQuestionReason[];
  messages: string[];
  stats: RandomQuestionPreviewStats;
  items: RandomQuestionPreviewItem[];
};

export type RandomQuestionPlannedGroup = Omit<RandomQuestionPreviewResult, 'showDate'> & {
  planId: string;
};

export type RandomQuestionPlannedDateResult = RandomQuestionPreviewResult & {
  planId: string;
};

export type RandomQuestionStoredItem = {
  id: string;
  showDate: string;
  questionId: string;
  questionUuid: string;
  asFirst: number;
  category: string;
  sortOrder: number;
  question: QuestionDetailDto | null;
};

export type RandomQuestionDetailResult = {
  showDate: string;
  stats: RandomQuestionPreviewStats;
  items: RandomQuestionStoredItem[];
};

export type RandomQuestionDateSummary = {
  showDate: string;
  total: number;
};

export type RandomQuestionDateListResult = {
  totalGeneratedDates: number;
  dates: RandomQuestionDateSummary[];
};

export type RandomQuestionAnalysisResult = RandomQuestionDateListResult & {
  totalQuestions: number;
  usedQuestions: number;
  remainingQuestions: number;
  availableFirstQuestions: number;
  estimatedNewDays: number;
  categoryInventory: RandomQuestionCategoryInventory[];
};

export type RandomQuestionPlanRangeResult = {
  startDate: string;
  endDate: string;
  requestedDays: number;
  plannedDates: RandomQuestionPlannedDateResult[];
};

export type RandomQuestionCategoryInventory = {
  category: string;
  firstCount: number;
  normalCount: number;
  totalCount: number;
};

export type RandomQuestionCommitResult = {
  saved: boolean;
  showDate: string;
  count: number;
};

export type RandomQuestionBulkCommitResult = {
  saved: boolean;
  dates: RandomQuestionCommitResult[];
};
