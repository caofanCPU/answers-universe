import { NextRequest, NextResponse } from 'next/server';
import { createAnswersUniverseClient } from '@windrun-huaiin/faq-sdk';
import { z } from 'zod';

const sdkTestRequestSchema = z.object({
  ids: z.array(z.string().regex(/^\d+$/)).min(1).max(100),
});

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSdkClient() {
  return createAnswersUniverseClient({
    baseUrl: readRequiredEnv('WINDRUN_HUAIIN_FAQ_BASE_URL'),
    clientId: readRequiredEnv('WINDRUN_HUAIIN_FAQ_CLIENT_ID'),
    keyVersion: readRequiredEnv('WINDRUN_HUAIIN_FAQ_KEY_VERSION'),
    publicKey: readRequiredEnv('NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK'),
    privateKey: readRequiredEnv('WINDRUN_HUAIIN_FAQ_SK'),
    idsBatchSize: 50,
    parallelism: 3,
    timeoutMs: 10_000,
  });
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
    const client = createSdkClient();
    const baseResult = await client.v1.questionsBase.getByIds(body.ids);
    const firstItem = baseResult.items[0] ?? null;
    const detail = firstItem ? await client.v1.questionDetail.getById(firstItem.id) : null;

    return NextResponse.json({
      ids: body.ids,
      baseResult,
      detail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error);
    }

    return internalServerError(error);
  }
}
