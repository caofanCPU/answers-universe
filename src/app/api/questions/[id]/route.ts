import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAppUser } from '@/server/questions/auth';
import { getQuestionById, updateQuestion } from '@/server/questions/service';
import { questionIdParamSchema, questionUpsertSchema } from '../schema';

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

function notFound() {
  return NextResponse.json(
    {
      error: 'NOT_FOUND',
    },
    { status: 404 }
  );
}

function internalServerError(error: unknown) {
  console.error('Question detail route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await requireAppUser();

    const { id } = questionIdParamSchema.parse(await context.params);
    const result = await getQuestionById(id);

    if (!result) {
      return notFound();
    }

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

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const appUser = await requireAppUser();
    const { id } = questionIdParamSchema.parse(await context.params);
    const body = await req.json();
    const input = questionUpsertSchema.parse(body);

    const result = await updateQuestion(id, input, appUser.userId);

    if (!result) {
      return notFound();
    }

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
