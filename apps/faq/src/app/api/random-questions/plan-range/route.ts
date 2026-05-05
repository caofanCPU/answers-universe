import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { planRandomQuestionRangeWithSnapshot } from '@/server/random-questions/random.service';
import { randomQuestionPlanRangeBodySchema } from '../schema';
import { badRequest, internalServerError, unauthorized } from '../route-utils';

export async function POST(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const body = await req.json();
    const input = randomQuestionPlanRangeBodySchema.parse(body);
    const result = await planRandomQuestionRangeWithSnapshot(input.snapshotVersion, input.startDate, input.endDate);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    if (error instanceof Error && error.message === 'SNAPSHOT_VERSION_MISMATCH') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return internalServerError('Random question plan range route error', error);
  }
}
