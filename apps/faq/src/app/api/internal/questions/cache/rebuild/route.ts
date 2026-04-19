import { NextRequest, NextResponse } from 'next/server';
import { verifyQstashSignature } from '@windrun-huaiin/backend-core/lib';
import { z } from 'zod';
import {
  deleteOuterQuestionDetailCache,
  isOuterQuestionCacheEnabled,
} from '@/server/questions/outer-cache';
import { rebuildOuterQuestionDetailCache } from '@/server/questions/service';

const rebuildQuestionCachePayloadSchema = z.object({
  questionId: z.string().trim().min(1),
  reason: z.enum(['create', 'update', 'delete', 'import', 'read_miss']),
  deleteOnly: z.boolean().optional().default(false),
});

const rebuildQuestionCacheEnvelopeSchema = z.object({
  source_msg_id: z.string().trim().min(1),
  payload: rebuildQuestionCachePayloadSchema,
});

function readRequiredTaskUrl(): string {
  const value = process.env.NEXT_PUBLIC_QSTASH_CACHE_TASK_URL?.trim();

  if (!value) {
    throw new Error('MISSING_QSTASH_CACHE_TASK_URL');
  }

  return value;
}

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
      url: readRequiredTaskUrl(),
    });

    const envelope = rebuildQuestionCacheEnvelopeSchema.parse(JSON.parse(rawBody));
    const payload = envelope.payload;

    const questionId = z.coerce.bigint().positive().parse(payload.questionId);

    if (!isOuterQuestionCacheEnabled()) {
      return NextResponse.json({
        ok: true,
        status: 'skipped_cache_disabled',
      });
    }

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
      console.error('[Question cache rebuild] Invalid payload', error.flatten());
      return badRequest(error);
    }

    if (error instanceof Error && error.message === 'MISSING_QSTASH_CACHE_TASK_URL') {
      return internalServerError(error);
    }

    if (error instanceof Error && /signature|unauthorized|signing keys/i.test(error.message)) {
      return unauthorized();
    }

    return internalServerError(error);
  }
}
