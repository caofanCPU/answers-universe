import type { OuterApiError, OuterApiErrorCode } from '@windrun-huaiin/faq-contracts/outer/v1';

export class AnswersUniverseSdkError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(code: string, message: string, options?: { status?: number; details?: unknown }) {
    super(message);
    this.name = 'AnswersUniverseSdkError';
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

export class AnswersUniverseApiError extends AnswersUniverseSdkError {
  readonly apiError: OuterApiError;

  constructor(apiError: OuterApiError, status?: number) {
    super(apiError.error, apiError.message ?? apiError.error, {
      status,
      details: apiError.details,
    });
    this.name = 'AnswersUniverseApiError';
    this.apiError = apiError;
  }
}

export function isOuterApiError(value: unknown): value is OuterApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const error = candidate.error;
  const validCodes: OuterApiErrorCode[] = [
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'NOT_FOUND',
    'INTERNAL_SERVER_ERROR',
  ];

  return typeof error === 'string' && validCodes.includes(error as OuterApiErrorCode);
}
