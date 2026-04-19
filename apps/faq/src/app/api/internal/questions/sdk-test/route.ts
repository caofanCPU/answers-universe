import { NextRequest, NextResponse } from 'next/server';
import { createAnswersUniverseClientFromEnv } from '@windrun-huaiin/faq-sdk';
import { z } from 'zod';

const sdkTestRequestSchema = z.object({
  ids: z.array(z.string().regex(/^\d+$/)).min(1).max(10_000),
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

function internalServerError(error: unknown) {
  console.error('SDK test route error:', error);
  return NextResponse.json(
    {
      error: 'SDK_TEST_FAILED',
      message: error instanceof Error ? error.message : 'Unknown SDK test error',
    },
    { status: 500 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = sdkTestRequestSchema.parse(await req.json());
    const client = createAnswersUniverseClientFromEnv();
    const baseResult = await client.v1.questionsBase.getByIds(body.ids);

    return NextResponse.json({
      ids: body.ids,
      baseResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error);
    }

    return internalServerError(error);
  }
}
