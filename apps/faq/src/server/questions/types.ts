import type {
  OuterQuestionBaseItemDto,
  OuterQuestionBaseResult,
  OuterQuestionDetailDto,
} from '@windrun-huaiin/faq-contracts/outer/v1';

export type QuestionListItemDto = {
  id: string;
  uuid: string;
  question: string;
  correctAnswer: string;
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
  ids?: bigint[];
  uuid?: string;
  uuids?: string[];
  question?: string;
  correctAnswer?: string;
  asFirst?: boolean;
  category?: string;
  subCategory?: string;
  difficulty?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;
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

export type OuterQuestionBaseQueryParams = {
  ids?: bigint[];
};

export type {
  OuterQuestionBaseItemDto,
  OuterQuestionBaseResult,
  OuterQuestionDetailDto,
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

export type QuestionImportFieldKey =
  | 'question'
  | 'cdnImagePrefix'
  | 'questionImage'
  | 'correctAnswer'
  | 'correctAnswerIndex'
  | 'incorrectAnswers'
  | 'explanation'
  | 'difficulty'
  | 'category'
  | 'subCategory'
  | 'tags'
  | 'keywords'
  | 'asFirst';

export type QuestionImportFieldErrors = Partial<Record<QuestionImportFieldKey, string>>;

export type QuestionImportDraftDto = {
  importId: string;
  index: number;
  question: string;
  cdnImagePrefix: string;
  questionImage: string;
  correctAnswer: string;
  correctAnswerIndex: number | null;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string | null;
  tags: string[];
  keywords: string[];
  asFirst: boolean;
};

export type QuestionImportValidationItem = QuestionImportDraftDto & {
  valid: boolean;
  fieldErrors: QuestionImportFieldErrors;
  globalErrors: string[];
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
  importedImportIds: string[];
  items: QuestionImportValidationItem[];
};
