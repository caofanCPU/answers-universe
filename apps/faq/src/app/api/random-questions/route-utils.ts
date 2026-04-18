import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function badRequest(error: unknown) {
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

export function unauthorized() {
  return NextResponse.json(
    {
      error: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

export function conflict(message: string) {
  return NextResponse.json(
    {
      error: 'CONFLICT',
      message,
    },
    { status: 409 }
  );
}

export function notFound(message: string) {
  return NextResponse.json(
    {
      error: 'NOT_FOUND',
      message,
    },
    { status: 404 }
  );
}

export function internalServerError(scope: string, error: unknown) {
  console.error(`${scope}:`, error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

