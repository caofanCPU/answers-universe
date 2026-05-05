import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { commitRandomQuestionSets } from '@/server/random-questions/random.service';
import { randomQuestionBulkCommitBodySchema } from '../schema';
import { internalServerError, unauthorized } from '../route-utils';

export async function POST(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const body = await req.json();
    const input = randomQuestionBulkCommitBodySchema.parse(body);
    const result = await commitRandomQuestionSets(input.plans);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'SNAPSHOT_VERSION_MISMATCH') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('group mismatch')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('planned group not found')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json({ error: error.message }, { status: 423 });
    }
    return internalServerError('Random question bulk commit route error', error);
  }
}
