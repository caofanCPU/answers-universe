import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiAuthUtils } from '@windrun-huaiin/backend-core/auth/server';
import { AUTH_ERRORS } from '@windrun-huaiin/backend-core/auth/shared';
import { getQuestionExportList } from '@/server/questions/service';
import type { QuestionExportColumn, QuestionExportItemDto } from '@/server/questions/types';
import { questionExportQuerySchema } from '../schema';

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
  console.error('Questions export route error:', error);
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function getColumnValue(item: QuestionExportItemDto, column: QuestionExportColumn): string {
  switch (column) {
    case 'id':
      return item.id;
    case 'question_uuid':
      return item.questionUuid;
    case 'category':
      return item.category;
    case 'sub_category':
      return item.subCategory ?? '';
    case 'as_first':
      return String(item.asFirst);
    default:
      return '';
  }
}

function buildCsv(items: QuestionExportItemDto[], columns: QuestionExportColumn[]): string {
  const lines = [
    columns.join(','),
    ...items.map((item) => columns.map((column) => escapeCsv(getColumnValue(item, column))).join(',')),
  ];

  return `\uFEFF${lines.join('\n')}`;
}

function buildFilename(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `ay-${timestamp}-query.csv`;
}

export async function GET(req: NextRequest) {
  try {
    const authUtils = new ApiAuthUtils(req);
    await authUtils.requireAuth();

    const query = questionExportQuerySchema.parse({
      id: req.nextUrl.searchParams.get('id') ?? undefined,
      uuid: req.nextUrl.searchParams.get('uuid') ?? undefined,
      asFirst: req.nextUrl.searchParams.get('asFirst') ?? undefined,
      category: req.nextUrl.searchParams.get('category') ?? undefined,
      subCategory: req.nextUrl.searchParams.get('subCategory') ?? undefined,
      difficulty: req.nextUrl.searchParams.get('difficulty') ?? undefined,
      columns: req.nextUrl.searchParams.get('columns') ?? undefined,
    });

    const items = await getQuestionExportList(query);
    const csv = buildCsv(items, query.columns);
    const filename = buildFilename();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === AUTH_ERRORS.unauthorized || error.message === AUTH_ERRORS.userNotFound)) {
      return unauthorized();
    }
    if (error instanceof ZodError) {
      return badRequest(error);
    }
    return internalServerError(error);
  }
}
