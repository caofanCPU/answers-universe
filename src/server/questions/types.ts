export type QuestionListItemDto = {
  id: string;
  uuid: string;
  question: string;
  category: string;
  subCategory: string | null;
  difficulty: string;
  tags: string[];
  keywords: string[];
  asFirst: boolean;
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
  asFirst: boolean;
  tags: string[];
  keywords: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuestionListParams = {
  page: number;
  pageSize: number;
  id?: bigint;
  uuid?: string;
  asFirst?: boolean;
  category?: string;
  subCategory?: string;
  difficulty?: string;
};

export type QuestionExportColumn = 'id' | 'question_uuid' | 'category' | 'sub_category' | 'as_first';

export type QuestionExportItemDto = {
  id: string;
  questionUuid: string;
  category: string;
  subCategory: string | null;
  asFirst: number;
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
  asFirst?: boolean;
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

export type QuestionImportDisplayFieldKey = 'fullInsertSql' | 'fullUuidSql';

export type QuestionImportDisplayField = {
  key: QuestionImportDisplayFieldKey;
  value: string;
};

export type QuestionImportCommitResult = {
  total: number;
  successCount: number;
  failedCount: number;
  displayFields: QuestionImportDisplayField[];
  items: QuestionImportPreviewDto[];
};
