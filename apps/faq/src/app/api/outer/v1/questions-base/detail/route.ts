import { NextRequest, NextResponse } from 'next/server';
import type { OuterApiError, OuterQuestionDetailDto } from '@windrun-huaiin/faq-contracts/outer/v1';
import { ZodError, z } from 'zod';
import { requireOuterV1ApiAuth } from '@/lib/server/outer-v1-api-auth';
import { getQuestionById } from '@/server/questions/service';

const outerQuestionDetailQuerySchema = z.object({
  id: z.coerce.bigint().positive(),
});

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

function notFound() {
  const response: OuterApiError = {
    error: 'NOT_FOUND',
  };

  return NextResponse.json(response, { status: 404 });
}

function internalServerError(error: unknown) {
  console.error('Outer v1 question detail route error:', error);
  const response: OuterApiError = {
    error: 'INTERNAL_SERVER_ERROR',
  };

  return NextResponse.json(response, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireOuterV1ApiAuth(req);

    const query = outerQuestionDetailQuerySchema.parse({
      id: req.nextUrl.searchParams.get('id') ?? undefined,
    });

    const result = await getQuestionById(query.id);

    if (!result) {
      return notFound();
    }

    const response: OuterQuestionDetailDto = result;
    return NextResponse.json(response);
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
