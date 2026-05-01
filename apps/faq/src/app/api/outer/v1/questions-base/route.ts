import { NextRequest, NextResponse } from 'next/server';
import type { OuterApiError, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import { ZodError } from 'zod';
import { requireOuterV1ApiAuth } from '@/lib/server/outer-v1-api-auth';
import { getOuterQuestionBaseByIds } from '@/server/questions/service';
import { outerQuestionBaseQuerySchema } from '../../questions-base/schema';

const OUTER_V1_TRACE_ID_HEADER = 'x-windrun-huaiin-faq-outer-v1-trace-id';

function readTraceId(req: NextRequest): string | undefined {
  return req.headers.get(OUTER_V1_TRACE_ID_HEADER)?.trim() || undefined;
}

function withTraceId(traceId?: string): { traceId: string } | Record<string, never> {
  return traceId ? { traceId } : {};
}

function isSdkDebugEnabled(): boolean {
  return process.env.WINDRUN_HUAIIN_SDK_DEBUG === 'true';
}

function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    const response: OuterApiError = {
      error: 'INVALID_REQUEST',
      details: error.flatten(),
    };

    return NextResponse.json(response, { status: 400 });
  }

  const response: OuterApiError = {
    error: 'INVALID_REQUEST',
  };

  return NextResponse.json(response, { status: 400 });
}

function unauthorized() {
  const response: OuterApiError = {
    error: 'UNAUTHORIZED',
  };

  return NextResponse.json(response, { status: 401 });
}

function internalServerError(error: unknown, traceId?: string) {
  console.error('Outer v1 questions-base route error:', {
    ...withTraceId(traceId),
    error,
  });
  const response: OuterApiError = {
    error: 'INTERNAL_SERVER_ERROR',
  };

  return NextResponse.json(response, { status: 500 });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const traceId = readTraceId(req);
  const debugEnabled = isSdkDebugEnabled();

  if (debugEnabled) {
    console.debug('[Outer V1 Questions Base Route] Request started', {
      ...withTraceId(traceId),
      method: req.method.toUpperCase(),
      path: req.nextUrl.pathname,
      query: req.nextUrl.searchParams.toString(),
    });
  }

  try {
    await requireOuterV1ApiAuth(req, {
      reserveNonce: false,
      validateTimestampWindow: false,
      traceId,
    });
    const query = outerQuestionBaseQuerySchema.parse(await req.json());

    const result: OuterQuestionBaseResult = await getOuterQuestionBaseByIds(query, { traceId });
    if (debugEnabled) {
      console.debug('[Outer V1 Questions Base Route] Request completed', {
        ...withTraceId(traceId),
        status: 200,
        durationMs: Date.now() - startedAt,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      if (debugEnabled) {
        console.debug('[Outer V1 Questions Base Route] Request completed', {
          ...withTraceId(traceId),
          status: 401,
          durationMs: Date.now() - startedAt,
        });
      }
      return unauthorized();
    }
    if (error instanceof ZodError) {
      if (debugEnabled) {
        console.debug('[Outer V1 Questions Base Route] Request completed', {
          ...withTraceId(traceId),
          status: 400,
          durationMs: Date.now() - startedAt,
        });
      }
      return badRequest(error);
    }
    if (debugEnabled) {
      console.debug('[Outer V1 Questions Base Route] Request completed', {
        ...withTraceId(traceId),
        status: 500,
        durationMs: Date.now() - startedAt,
      });
    }
    return internalServerError(error, traceId);
  }
}
