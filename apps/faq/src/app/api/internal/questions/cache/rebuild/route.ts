import { NextRequest, NextResponse } from 'next/server';
import { verifyQstashSignature } from '@windrun-huaiin/backend-core/lib';
import { z } from 'zod';
import {
  deleteOuterQuestionDetailCache,
} from '@/server/questions/outer-cache';
import { rebuildOuterQuestionDetailCache } from '@/server/questions/service';

const rebuildQuestionCachePayloadSchema = z.object({
  questionId: z.string().trim().min(1),
  reason: z.enum(['create', 'update', 'delete', 'import', 'read_miss']),
  deleteOnly: z.boolean().optional().default(false),
});

function badRequest(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'INVALID_REQUEST',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
}

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

function internalServerError(error: unknown) {
  console.error('Question cache rebuild route error:', error);
  return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('upstash-signature');

    if (!signature) {
      return unauthorized();
    }

    await verifyQstashSignature({
      signature,
      body: rawBody,
      url: req.url,
    });

    const payload = rebuildQuestionCachePayloadSchema.parse(JSON.parse(rawBody));
    const questionId = z.coerce.bigint().positive().parse(payload.questionId);

    if (payload.deleteOnly) {
      await deleteOuterQuestionDetailCache(payload.questionId);
      return NextResponse.json({
        ok: true,
        status: 'deleted',
      });
    }

    const status = await rebuildOuterQuestionDetailCache(questionId);
    return NextResponse.json({
      ok: true,
      status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error);
    }

    if (error instanceof Error && /signature|unauthorized|signing keys/i.test(error.message)) {
      return unauthorized();
    }

    return internalServerError(error);
  }
}
