import { prisma } from '@/server/prisma';
import { randomBytes } from 'node:crypto';
import { generateOuterClientKeyPair } from './keygen';
import type {
  OuterClientDetailDto,
  OuterClientExpiryOption,
  OuterClientKeyIssueResult,
  OuterClientKeySummaryDto,
  OuterClientListItemDto,
  OuterClientMutationResult,
} from './types';

const ACTIVE_CLIENT_STATUS = 'active';
const ACTIVE_KEY_STATUS = 'active';
const ROTATING_KEY_STATUS = 'rotating';
const DELETED_KEY_STATUS = 'deleted';
const DELETED_CLIENT_STATUS = 'deleted';
const DEFAULT_ROTATING_GRACE_DAYS = 7;

export type OuterClientKeyRecord = {
  clientId: string;
  keyVersion: string;
  algorithm: string;
  publicKey: string;
  status: string;
};

function getRuntimeEnvironment(): 'test' | 'live' {
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function resolveExpiresAt(option: OuterClientExpiryOption, from = new Date()): Date | null {
  if (option === 'never') {
    return null;
  }

  if (option === '3_months') {
    return addMonths(from, 3);
  }

  if (option === '6_months') {
    return addMonths(from, 6);
  }

  return addMonths(from, 12);
}

function resolveRotatingGraceExpiresAt(from = new Date()): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + DEFAULT_ROTATING_GRACE_DAYS);
  return next;
}

async function generateClientId() {
  for (let index = 0; index < 10; index += 1) {
    const suffix = randomBytes(9).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const clientId = `client_${suffix}`;
    const existed = await prisma.outerClient.findUnique({
      where: {
        clientId,
      },
      select: {
        clientId: true,
      },
    });

    if (!existed) {
      return clientId;
    }
  }

  throw new Error('Failed to generate unique client id');
}

export async function getActiveOuterClientKey(
  clientId: string,
  keyVersion: string
): Promise<OuterClientKeyRecord | null> {
  const record = await prisma.outerClientKey.findUnique({
    where: {
      clientId_keyVersion: {
        clientId,
        keyVersion,
      },
    },
    select: {
      clientId: true,
      keyVersion: true,
      algorithm: true,
      publicKey: true,
      status: true,
      client: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!record || record.status !== ACTIVE_KEY_STATUS || record.client.status !== ACTIVE_CLIENT_STATUS) {
    return null;
  }

  return {
    clientId: record.clientId,
    keyVersion: record.keyVersion,
    algorithm: record.algorithm,
    publicKey: record.publicKey,
    status: record.status,
  };
}

export async function touchOuterClientKeyLastUsedAt(clientId: string, keyVersion: string) {
  await prisma.outerClientKey.updateMany({
    where: {
      clientId,
      keyVersion,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
}

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function buildOuterClientListItemDto(record: {
  clientId: string;
  name: string;
  status: string;
  remark: string | null;
  keys: Array<{ environment: string; status: string }>;
  createdAt: Date | null;
  updatedAt: Date | null;
}): OuterClientListItemDto {
  const environment = record.keys[0]?.environment ?? null;
  const activeKeyCount = record.keys.filter((item) => item.status === ACTIVE_KEY_STATUS).length;

  return {
    clientId: record.clientId,
    name: record.name,
    status: record.status,
    remark: record.remark,
    environment,
    keyCount: record.keys.length,
    activeKeyCount,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function buildOuterClientKeySummaryDto(record: {
  environment: string;
  keyVersion: string;
  algorithm: string;
  publicKey: string;
  fingerprint: string | null;
  status: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): OuterClientKeySummaryDto {
  return {
    environment: record.environment,
    keyVersion: record.keyVersion,
    algorithm: record.algorithm,
    publicKey: record.publicKey,
    fingerprint: record.fingerprint,
    status: record.status,
    expiresAt: toIsoString(record.expiresAt),
    lastUsedAt: toIsoString(record.lastUsedAt),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export async function listOuterClients(): Promise<OuterClientListItemDto[]> {
  const records = await prisma.outerClient.findMany({
    where: {
      status: {
        not: DELETED_CLIENT_STATUS,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      clientId: true,
      name: true,
      status: true,
      remark: true,
      keys: {
        select: {
          environment: true,
          status: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return records.map(buildOuterClientListItemDto);
}

export async function getOuterClientDetail(clientId: string): Promise<OuterClientDetailDto | null> {
  const record = await prisma.outerClient.findUnique({
    where: {
      clientId,
    },
    select: {
      clientId: true,
      name: true,
      status: true,
      remark: true,
      keys: {
        where: {
          status: {
            not: DELETED_KEY_STATUS,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          environment: true,
          keyVersion: true,
          algorithm: true,
          publicKey: true,
          fingerprint: true,
          status: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record || record.status === DELETED_CLIENT_STATUS) {
    return null;
  }

  return {
    ...buildOuterClientListItemDto(record),
    keys: record.keys.map(buildOuterClientKeySummaryDto),
  };
}

export async function createOuterClient(input: {
  name: string;
  expiresIn: OuterClientExpiryOption;
  remark?: string | null;
  createdByUserId?: string;
}): Promise<OuterClientMutationResult & OuterClientKeyIssueResult> {
  const clientId = await generateClientId();
  const environment = getRuntimeEnvironment();
  const keyPair = generateOuterClientKeyPair(environment);
  const expiresAt = resolveExpiresAt(input.expiresIn);

  await prisma.$transaction(async (tx) => {
    await tx.outerClient.create({
      data: {
        clientId,
        name: input.name,
        status: ACTIVE_CLIENT_STATUS,
        remark: input.remark ?? null,
        createdByUserId: input.createdByUserId ?? null,
        updatedByUserId: input.createdByUserId ?? null,
      },
    });

    await tx.outerClientKey.create({
      data: {
        clientId,
        environment,
        keyVersion: keyPair.keyVersion,
        algorithm: keyPair.algorithm,
        publicKey: keyPair.publicKey,
        fingerprint: keyPair.fingerprint,
        status: ACTIVE_KEY_STATUS,
        expiresAt,
      },
    });
  });

  return {
    clientId,
    environment,
    keyVersion: keyPair.keyVersion,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    algorithm: keyPair.algorithm,
    fingerprint: keyPair.fingerprint,
  };
}

export async function issueOuterClientKey(input: {
  clientId: string;
  expiresIn: OuterClientExpiryOption;
}): Promise<OuterClientKeyIssueResult> {
  const environment = getRuntimeEnvironment();
  const keyPair = generateOuterClientKeyPair(environment);
  const expiresAt = resolveExpiresAt(input.expiresIn);
  const rotatingExpiresAt = resolveRotatingGraceExpiresAt();

  await prisma.$transaction(async (tx) => {
    await tx.outerClientKey.updateMany({
      where: {
        clientId: input.clientId,
        environment,
        status: ACTIVE_KEY_STATUS,
      },
      data: {
        status: ROTATING_KEY_STATUS,
        expiresAt: rotatingExpiresAt,
      },
    });

    await tx.outerClientKey.create({
      data: {
        clientId: input.clientId,
        environment,
        keyVersion: keyPair.keyVersion,
        algorithm: keyPair.algorithm,
        publicKey: keyPair.publicKey,
        fingerprint: keyPair.fingerprint,
        status: ACTIVE_KEY_STATUS,
        expiresAt,
      },
    });
  });

  return {
    clientId: input.clientId,
    environment,
    keyVersion: keyPair.keyVersion,
    algorithm: keyPair.algorithm,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    fingerprint: keyPair.fingerprint,
  };
}

export async function deleteOuterClient(clientId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.outerClient.update({
      where: {
        clientId,
      },
      data: {
        status: DELETED_CLIENT_STATUS,
      },
    });

    await tx.outerClientKey.updateMany({
      where: {
        clientId,
      },
      data: {
        status: DELETED_KEY_STATUS,
      },
    });
  });
}

export async function deleteOuterClientKey(clientId: string, keyVersion: string) {
  await prisma.outerClientKey.updateMany({
    where: {
      clientId,
      keyVersion,
    },
    data: {
      status: DELETED_KEY_STATUS,
    },
  });
}

export async function extendOuterClientKey(params: {
  clientId: string;
  keyVersion: string;
  extendBy: OuterClientExpiryOption;
}) {
  const record = await prisma.outerClientKey.findFirst({
    where: {
      clientId: params.clientId,
      keyVersion: params.keyVersion,
      status: {
        not: DELETED_KEY_STATUS,
      },
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  if (!record) {
    return null;
  }

  if (params.extendBy === 'never') {
    await prisma.outerClientKey.update({
      where: {
        id: record.id,
      },
      data: {
        expiresAt: null,
      },
    });

    return;
  }

  const baseTime = record.expiresAt ?? new Date();
  const nextExpiresAt = resolveExpiresAt(params.extendBy, baseTime);

  await prisma.outerClientKey.update({
    where: {
      id: record.id,
    },
    data: {
      expiresAt: nextExpiresAt,
    },
  });
}
