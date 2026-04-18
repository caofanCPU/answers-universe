import { NextRequest, NextResponse } from 'next/server';
import type { OuterApiError, OuterQuestionBaseResult } from '@windrun-huaiin/faq-contracts/outer/v1';
import { ZodError } from 'zod';
import { requireOuterV1ApiAuth } from '@/lib/server/outer-v1-api-auth';
import { getOuterQuestionBaseList } from '@/server/questions/service';
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

export async function GET(req: NextRequest) {
  try {
    await requireOuterV1ApiAuth(req);

    const query = outerQuestionBaseQuerySchema.parse({
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      pageSize: req.nextUrl.searchParams.get('pageSize') ?? undefined,
      ids: req.nextUrl.searchParams.get('ids') ?? undefined,
      uuids: req.nextUrl.searchParams.get('uuids') ?? undefined,
      asFirst: req.nextUrl.searchParams.get('asFirst') ?? undefined,
      category: req.nextUrl.searchParams.get('category') ?? undefined,
      subCategory: req.nextUrl.searchParams.get('subCategory') ?? undefined,
      difficulty: req.nextUrl.searchParams.get('difficulty') ?? undefined,
      createdAtFrom: req.nextUrl.searchParams.get('createdAtFrom') ?? undefined,
      createdAtTo: req.nextUrl.searchParams.get('createdAtTo') ?? undefined,
      updatedAtFrom: req.nextUrl.searchParams.get('updatedAtFrom') ?? undefined,
      updatedAtTo: req.nextUrl.searchParams.get('updatedAtTo') ?? undefined,
    });

    const result: OuterQuestionBaseResult = await getOuterQuestionBaseList(query);
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
