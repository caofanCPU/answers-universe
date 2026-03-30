export type QuestionListItemDto = {
  id: string;
  uuid: string;
  question: string;
  category: string;
  subCategory: string | null;
  difficulty: string;
  tags: string[];
  keywords: string[];
  isFirst: boolean;
  updatedAt: string | null;
};

export type QuestionDetailDto = {
  id: string;
  uuid: string;
  question: string;
  cdnImagePrefix: string | null;
  questionImage: string | null;
  questionImageUrl: string | null;
  correctAnswer: string;
  correctAnswerIndex: number;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string | null;
  isFirst: boolean;
  tags: string[];
  keywords: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuestionListParams = {
  page: number;
  pageSize: number;
  category?: string;
  subCategory?: string;
  difficulty?: string;
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
  correctAnswerIndex?: number;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory?: string | null;
  isFirst?: boolean;
  tags?: string[];
  keywords?: string[];
};

export type QuestionMutationResult = {
  id: string;
};

export type QuestionImportPreviewDto = {
  index: number;
  valid: boolean;
  errors: string[];
  question: string;
  category: string;
  subCategory: string | null;
  difficulty: string;
  tags: string[];
  keywords: string[];
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
