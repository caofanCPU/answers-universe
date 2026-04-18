import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { createOuterClient, listOuterClients } from '@/server/outer-clients/service';
import { outerClientCreateSchema } from './schema';

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
  console.error('Question clients route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

export async function GET(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const result = await listOuterClients();
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

export async function POST(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    const { user } = await authUtils.requireAuthWithUser();
    const body = await req.json();
    const input = outerClientCreateSchema.parse(body);

    const result = await createOuterClient({
      name: input.name,
      remark: input.remark ?? null,
      expiresIn: input.expiresIn,
      createdByUserId: user.userId,
    });

    return NextResponse.json(result, { status: 201 });
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
