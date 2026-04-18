import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { deleteOuterClient, getOuterClientDetail } from '@/server/outer-clients/service';
import { outerClientIdParamSchema } from '../schema';

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
  console.error('Question client detail route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const { clientId } = outerClientIdParamSchema.parse(await context.params);
    const result = await getOuterClientDetail(clientId);

    if (!result) {
      return notFound();
    }

    return NextResponse.json(result);
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const { clientId } = outerClientIdParamSchema.parse(await context.params);
    await deleteOuterClient(clientId);

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
