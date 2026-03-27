export type QuestionListItemDto = {
  id: string;
  question: string;
  category: string;
  subCategory: string;
  difficulty: string;
  tags: string[];
  isFirst: boolean;
  updatedAt: string | null;
};

export type QuestionDetailDto = {
  id: string;
  question: string;
  cdnImagePrefix: string | null;
  questionImage: string | null;
  questionImageUrl: string | null;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string;
  isFirst: boolean;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuestionListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
};

export type QuestionListResult = {
  items: QuestionListItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type QuestionUpsertInput = {
  question: string;
  cdnImagePrefix?: string | null;
  questionImage?: string | null;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string;
  isFirst?: boolean;
  tags?: string[];
};

export type QuestionImportPreviewDto = {
  index: number;
  valid: boolean;
  errors: string[];
  question: string;
  category: string;
  subCategory: string;
  difficulty: string;
  tags: string[];
};

export type QuestionImportValidationItem = QuestionImportPreviewDto & {
  payload: QuestionUpsertInput | null;
};

export type QuestionImportValidationResult = {
  total: number;
  validCount: number;
  invalidCount: number;
  items: QuestionImportValidationItem[];
};

export type QuestionImportCommitResult = {
  total: number;
  successCount: number;
  failedCount: number;
  createdIds: string[];
  items: QuestionImportPreviewDto[];
};
