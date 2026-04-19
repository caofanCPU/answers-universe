import { NextRequest, NextResponse } from 'next/server';
import type { OuterApiError, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import { ZodError } from 'zod';
import { requireOuterV1ApiAuth } from '@/lib/server/outer-v1-api-auth';
import { getOuterQuestionBaseByIds } from '@/server/questions/service';
import { outerQuestionBaseQuerySchema } from '../../questions-base/schema';

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

function internalServerError(error: unknown) {
  console.error('Outer v1 questions-base route error:', error);
  const response: OuterApiError = {
    error: 'INTERNAL_SERVER_ERROR',
  };

  return NextResponse.json(response, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    await requireOuterV1ApiAuth(req, {
      reserveNonce: false,
      validateTimestampWindow: false,
    });
    const query = outerQuestionBaseQuerySchema.parse(await req.json());

    const result: OuterQuestionBaseResult = await getOuterQuestionBaseByIds(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}
