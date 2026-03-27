import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAppUser } from '@/server/questions/auth';
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
    await requireAppUser();

    const query = questionListQuerySchema.parse({
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      pageSize: req.nextUrl.searchParams.get('pageSize') ?? undefined,
      keyword: req.nextUrl.searchParams.get('keyword') ?? undefined,
      category: req.nextUrl.searchParams.get('category') ?? undefined,
      difficulty: req.nextUrl.searchParams.get('difficulty') ?? undefined,
      tags: req.nextUrl.searchParams.get('tags') ?? undefined,
    });

    const result = await getQuestionList(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'USER_NOT_FOUND')) {
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
    const appUser = await requireAppUser();
    const body = await req.json();
    const input = questionUpsertSchema.parse(body);

    const result = await createQuestion(input, appUser.userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'USER_NOT_FOUND')) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}
