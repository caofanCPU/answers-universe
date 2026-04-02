import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireOuterApiAuth } from '@/lib/server/outer-api-auth';
import { getOuterQuestionBaseList } from '@/server/questions/service';
import { outerQuestionBaseQuerySchema } from './schema';

function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'INVALID_REQUEST',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: 'INVALID_REQUEST',
    },
    { status: 400 }
  );
}

function unauthorized() {
  return NextResponse.json(
    {
      error: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

function internalServerError(error: unknown) {
  console.error('Outer questions-base route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

export async function GET(req: NextRequest) {
  try {
    requireOuterApiAuth(req);

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

    const result = await getOuterQuestionBaseList(query);
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
