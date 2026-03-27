import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAppUser } from '@/server/questions/auth';
import { validateQuestionImportItems } from '@/server/questions/service';
import { questionImportBodySchema } from '../../schema';

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

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

  return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
}

function internalServerError(error: unknown) {
  console.error('Question import validate route error:', error);
  return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    await requireAppUser();
    const body = questionImportBodySchema.parse(await req.json());
    const result = validateQuestionImportItems(body.items);
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
