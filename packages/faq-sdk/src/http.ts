import type { OuterApiError } from '@windrun-huaiin/faq-contracts/outer/v1';
import { buildAuthHeaders } from './auth.js';
import { AnswersUniverseApiError, AnswersUniverseSdkError, isOuterApiError } from './errors.js';
import type { AnswersUniverseResolvedOptions } from './types.js';

export async function requestJson<TResponse>(
  options: AnswersUniverseResolvedOptions,
  path: string,
  init?: {
    method?: 'GET';
    query?: URLSearchParams;
  }
): Promise<TResponse> {
  const url = new URL(path, `${options.baseUrl}/`);

  if (init?.query) {
    url.search = init.query.toString();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const authHeaders = buildAuthHeaders(options, {
      method: init?.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams.toString(),
    });

    const response = await options.fetch(url, {
      method: init?.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...authHeaders,
      },
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      if (isOuterApiError(payload)) {
        throw new AnswersUniverseApiError(payload as OuterApiError, response.status);
      }

      throw new AnswersUniverseSdkError(
        'HTTP_ERROR',
        `Request failed with status ${response.status}`,
        { status: response.status, details: payload ?? text }
      );
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof AnswersUniverseSdkError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AnswersUniverseSdkError('REQUEST_TIMEOUT', `Request timed out after ${options.timeoutMs}ms`);
    }

    throw new AnswersUniverseSdkError(
      'REQUEST_FAILED',
      error instanceof Error ? error.message : 'Unknown request error'
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
