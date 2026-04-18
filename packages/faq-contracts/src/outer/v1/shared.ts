export type OuterApiVersion = 'v1';

export type OuterPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type OuterApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export type OuterApiError = {
  error: OuterApiErrorCode;
  message?: string;
  details?: unknown;
};

export type OuterQuestionCategory = string;
export type OuterQuestionDifficulty = string;
export type OuterQuestionSubCategory = string;
