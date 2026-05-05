import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { commitRandomQuestionSet } from '@/server/random-questions/random.service';
import { randomQuestionCommitBodySchema } from '../schema';
import { badRequest, conflict, internalServerError, unauthorized } from '../route-utils';

export async function POST(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const body = await req.json();
    const input = randomQuestionCommitBodySchema.parse(body);
    const result = await commitRandomQuestionSet(input.snapshotVersion, input.groupId, input.showDate, input.items, {
      replaceExisting: input.replaceExisting,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return conflict(error.message);
    }
    if (error instanceof Error && error.message.includes('planned group not found')) {
      return conflict(error.message);
    }
    if (error instanceof Error && error.message === 'SNAPSHOT_VERSION_MISMATCH') {
      return NextResponse.json({ error: 'SNAPSHOT_VERSION_MISMATCH' }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('group mismatch')) {
      return badRequest(error);
    }
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json({ error: error.message }, { status: 423 });
    }
    if (error instanceof Error && error.message.includes('Invalid random question set')) {
      return badRequest(error);
    }
    return internalServerError('Random question commit route error', error);
  }
}
