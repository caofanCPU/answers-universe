import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { createQuestion, getQuestionList } from '@/server/questions/service';
import { questionListQuerySchema, questionUpsertSchema } from './schema';

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
  console.error('Questions route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

export async function GET(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const query = questionListQuerySchema.parse({
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      pageSize: req.nextUrl.searchParams.get('pageSize') ?? undefined,
      id: req.nextUrl.searchParams.get('id') ?? undefined,
      uuid: req.nextUrl.searchParams.get('uuid') ?? undefined,
      question: req.nextUrl.searchParams.get('question') ?? undefined,
      correctAnswer: req.nextUrl.searchParams.get('correctAnswer') ?? undefined,
      asFirst: req.nextUrl.searchParams.get('asFirst') ?? undefined,
      category: req.nextUrl.searchParams.get('category') ?? undefined,
      subCategory: req.nextUrl.searchParams.get('subCategory') ?? undefined,
      difficulty: req.nextUrl.searchParams.get('difficulty') ?? undefined,
      createdAtFrom: req.nextUrl.searchParams.get('createdAtFrom') ?? undefined,
      createdAtTo: req.nextUrl.searchParams.get('createdAtTo') ?? undefined,
    });

    const result = await getQuestionList(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    const { user } = await authUtils.requireAuthWithUser();
    const body = await req.json();
    const input = questionUpsertSchema.parse(body);

    const result = await createQuestion(input, user.userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}
