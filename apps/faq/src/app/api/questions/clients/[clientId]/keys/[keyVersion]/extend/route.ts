import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { extendOuterClientKey } from '@/server/outer-clients/service';
import { outerClientKeyExtendSchema, outerClientKeyParamSchema } from '../../../../schema';

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
  console.error('Question client key extend route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

type RouteContext = {
  params: Promise<{ clientId: string; keyVersion: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const { clientId, keyVersion } = outerClientKeyParamSchema.parse(await context.params);
    const body = await req.json();
    const input = outerClientKeyExtendSchema.parse(body);

    await extendOuterClientKey({
      clientId,
      keyVersion,
      extendBy: input.extendBy,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)
    ) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}
