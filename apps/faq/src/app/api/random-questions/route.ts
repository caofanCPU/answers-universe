import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { deleteRandomQuestionSetByDate, getRandomQuestionSetByDate } from '@/server/random-questions/random.service';
import { randomQuestionShowDateQuerySchema } from './schema';
import { badRequest, internalServerError, unauthorized } from './route-utils';

export async function GET(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const query = randomQuestionShowDateQuerySchema.parse({
      showDate: req.nextUrl.searchParams.get('showDate') ?? undefined,
    });

    const result = await getRandomQuestionSetByDate(query.showDate);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError('Random questions route error', error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const query = randomQuestionShowDateQuerySchema.parse({
      showDate: req.nextUrl.searchParams.get('showDate') ?? undefined,
    });

    const result = await deleteRandomQuestionSetByDate(query.showDate);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError('Random questions delete route error', error);
  }
}
