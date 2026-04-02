import { prisma } from '@windrun-huaiin/backend-core/prisma';
import type { Prisma, Usb } from '@prisma/client';
import { buildQuestionDetailDto } from '@/server/questions/service';
import type {
  RandomQuestionAnalysisResult,
  RandomQuestionCommitResult,
  RandomQuestionDateListResult,
  RandomQuestionDateSummary,
  RandomQuestionDetailResult,
  RandomQuestionDraftItem,
  RandomQuestionPreviewItem,
  RandomQuestionPreviewResult,
  RandomQuestionPreviewStats,
  RandomQuestionReason,
  RandomQuestionStoredItem,
} from './types';

const DEFAULT_RANDOM_QUESTION_COUNT = 5;

function getRandomQuestionTargetCount(): number {
  const rawValue = process.env.RANDOM_USB_DAILY_COUNT?.trim();
  if (!rawValue) {
    return DEFAULT_RANDOM_QUESTION_COUNT;
  }

  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_RANDOM_QUESTION_COUNT;
}

function parseShowDate(showDate: string): Date {
  return new Date(`${showDate}T00:00:00.000Z`);
}

function formatShowDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildPreviewStats(items: RandomQuestionDraftItem[]): RandomQuestionPreviewStats {
  const targetTotal = getRandomQuestionTargetCount();
  const actualFirstCount = items.filter((item) => item.asFirst === 1).length;
  const actualTotal = items.length;

  return {
    targetTotal,
    actualTotal,
    targetFirstCount: 1,
    actualFirstCount,
    targetNormalCount: Math.max(targetTotal - 1, 0),
    actualNormalCount: Math.max(actualTotal - actualFirstCount, 0),
  };
}

function buildPreviewMessages(reasons: RandomQuestionReason[]): string[] {
  const messages: string[] = [];

  if (reasons.includes('NO_FIRST_QUESTION_AVAILABLE')) {
    messages.push('No first question available');
  }

  if (reasons.includes('NOT_ENOUGH_NORMAL_QUESTIONS_AVAILABLE')) {
    messages.push('Not enough normal questions available');
  }

  return messages;
}

function buildDraftItem(record: Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'>, sortOrder: number): RandomQuestionDraftItem {
  return {
    questionId: record.id.toString(),
    questionUuid: record.questionUuid,
    asFirst: record.asFirst,
    category: record.category,
    sortOrder,
  };
}

async function attachQuestionDetails(items: RandomQuestionDraftItem[]): Promise<RandomQuestionPreviewItem[]> {
  if (items.length === 0) {
    return [];
  }

  const questionRecords = await prisma.usb.findMany({
    where: {
      id: {
        in: items.map((item) => BigInt(item.questionId)),
      },
    },
  });
  const questionMap = new Map(questionRecords.map((record) => [record.id.toString(), buildQuestionDetailDto(record)]));

  return items.map((item) => ({
    ...item,
    question: questionMap.get(item.questionId) ?? null,
  }));
}

function createStableNumberSeed(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function orderRecordsForStableSelection<T extends { id: bigint }>(records: T[], seedSource: string): T[] {
  return [...records].sort((left, right) => {
    const leftSeed = createStableNumberSeed(`${seedSource}-${left.id.toString()}`);
    const rightSeed = createStableNumberSeed(`${seedSource}-${right.id.toString()}`);

    if (leftSeed !== rightSeed) {
      return leftSeed - rightSeed;
    }

    return left.id < right.id ? -1 : 1;
  });
}

async function getUsedQuestionIds(excludeShowDate?: string): Promise<bigint[]> {
  const records = await prisma.randomUsb.findMany({
    where: excludeShowDate
      ? {
          showDate: {
            not: parseShowDate(excludeShowDate),
          },
        }
      : undefined,
    select: {
      questionId: true,
    },
  });

  return [...new Set(records.map((record) => record.questionId.toString()))].map((value) => BigInt(value));
}

async function getFirstQuestion(usedQuestionIds: bigint[], showDate: string): Promise<Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'> | null> {
  const records = await prisma.usb.findMany({
    where: {
      deleted: 0,
      asFirst: 1,
      ...(usedQuestionIds.length > 0
        ? {
            id: {
              notIn: usedQuestionIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
      questionUuid: true,
      asFirst: true,
      category: true,
    },
  });

  if (records.length === 0) {
    return null;
  }

  return orderRecordsForStableSelection(records, `first-${showDate}`)[0] ?? null;
}

async function getNormalQuestions(
  usedQuestionIds: bigint[],
  showDate: string,
  firstQuestion: Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'>
): Promise<Array<Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'>>> {
  const records = await prisma.usb.findMany({
    where: {
      deleted: 0,
      asFirst: 0,
      category: {
        not: firstQuestion.category,
      },
      ...(usedQuestionIds.length > 0
        ? {
            id: {
              notIn: usedQuestionIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
      questionUuid: true,
      asFirst: true,
      category: true,
    },
  });

  const groupedByCategory = new Map<string, Array<Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'>>>();

  for (const record of records) {
    const existing = groupedByCategory.get(record.category) ?? [];
    existing.push(record);
    groupedByCategory.set(record.category, existing);
  }

  const targetNormalCount = Math.max(getRandomQuestionTargetCount() - 1, 0);
  const categoryEntries = [...groupedByCategory.entries()].sort(([left], [right]) => {
    const leftSeed = createStableNumberSeed(`${showDate}-category-${left}`);
    const rightSeed = createStableNumberSeed(`${showDate}-category-${right}`);

    if (leftSeed !== rightSeed) {
      return leftSeed - rightSeed;
    }

    return left.localeCompare(right);
  });

  return categoryEntries
    .slice(0, targetNormalCount)
    .map(([, categoryRecords]) => orderRecordsForStableSelection(categoryRecords, `normal-${showDate}`)[0])
    .filter((record): record is Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'> => Boolean(record));
}

export async function previewRandomQuestionSet(
  showDate: string,
  options?: {
    excludeShowDate?: string;
  }
): Promise<RandomQuestionPreviewResult> {
  const targetCount = getRandomQuestionTargetCount();
  const usedQuestionIds = await getUsedQuestionIds(options?.excludeShowDate);
  const reasons: RandomQuestionReason[] = [];
  const firstQuestion = await getFirstQuestion(usedQuestionIds, showDate);

  if (!firstQuestion) {
    reasons.push('NO_FIRST_QUESTION_AVAILABLE');
    return {
      showDate,
      targetCount,
      canCommit: false,
      reasons,
      messages: buildPreviewMessages(reasons),
      stats: buildPreviewStats([]),
      items: [],
    };
  }

  const normalQuestions = await getNormalQuestions([...usedQuestionIds, firstQuestion.id], showDate, firstQuestion);
  const items = [
    buildDraftItem(firstQuestion, 1),
    ...normalQuestions.map((item, index) => buildDraftItem(item, index + 2)),
  ];
  const stats = buildPreviewStats(items);

  if (stats.actualNormalCount < stats.targetNormalCount) {
    reasons.push('NOT_ENOUGH_NORMAL_QUESTIONS_AVAILABLE');
  }

  const previewItems = await attachQuestionDetails(items);

  return {
    showDate,
    targetCount,
    canCommit: stats.actualTotal === stats.targetTotal && stats.actualFirstCount === stats.targetFirstCount,
    reasons,
    messages: buildPreviewMessages(reasons),
    stats,
    items: previewItems,
  };
}

function validateDraftItems(showDate: string, items: RandomQuestionDraftItem[]): void {
  const stats = buildPreviewStats(items);
  const firstItemCount = items.filter((item) => item.asFirst === 1).length;

  if (stats.actualTotal !== stats.targetTotal) {
    throw new Error(`Invalid random question set for ${showDate}: total count mismatch`);
  }

  if (firstItemCount !== 1) {
    throw new Error(`Invalid random question set for ${showDate}: first question count mismatch`);
  }
}

function buildRandomUsbCreateManyData(showDate: string, items: RandomQuestionDraftItem[]): Prisma.RandomUsbCreateManyInput[] {
  const showDateValue = parseShowDate(showDate);

  return items.map((item) => ({
    showDate: showDateValue,
    questionId: BigInt(item.questionId),
    questionUuid: item.questionUuid,
    asFirst: item.asFirst,
    category: item.category,
    sortOrder: item.sortOrder,
  }));
}

export async function commitRandomQuestionSet(
  showDate: string,
  items: RandomQuestionDraftItem[],
  options?: {
    replaceExisting?: boolean;
  }
): Promise<RandomQuestionCommitResult> {
  validateDraftItems(showDate, items);

  const showDateValue = parseShowDate(showDate);
  const existingCount = await prisma.randomUsb.count({
    where: {
      showDate: showDateValue,
    },
  });

  if (existingCount > 0 && !options?.replaceExisting) {
    throw new Error(`Random question set already exists for ${showDate}`);
  }

  await prisma.$transaction(async (tx) => {
    if (existingCount > 0 && options?.replaceExisting) {
      await tx.randomUsb.deleteMany({
        where: {
          showDate: showDateValue,
        },
      });
    }

    await tx.randomUsb.createMany({
      data: buildRandomUsbCreateManyData(showDate, items),
    });
  });

  return {
    saved: true,
    showDate,
    count: items.length,
  };
}

export async function regenerateRandomQuestionSet(showDate: string): Promise<RandomQuestionPreviewResult & { saved: boolean }> {
  const preview = await previewRandomQuestionSet(showDate, { excludeShowDate: showDate });

  if (!preview.canCommit) {
    return {
      ...preview,
      saved: false,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.randomUsb.deleteMany({
      where: {
        showDate: parseShowDate(showDate),
      },
    });

    await tx.randomUsb.createMany({
      data: buildRandomUsbCreateManyData(showDate, preview.items),
    });
  });

  return {
    ...preview,
    saved: true,
  };
}

export async function listRandomQuestionDates(): Promise<RandomQuestionDateListResult> {
  const grouped = await prisma.randomUsb.groupBy({
    by: ['showDate'],
    _count: {
      _all: true,
    },
    orderBy: {
      showDate: 'desc',
    },
  });

  const dates: RandomQuestionDateSummary[] = grouped.map((item) => ({
    showDate: formatShowDate(item.showDate),
    total: item._count._all,
  }));

  return {
    totalGeneratedDates: dates.length,
    dates,
  };
}

export async function getRandomQuestionAnalysis(): Promise<RandomQuestionAnalysisResult> {
  const [dateList, usedQuestionIds, totalQuestions] = await Promise.all([
    listRandomQuestionDates(),
    getUsedQuestionIds(),
    prisma.usb.count({
      where: {
        deleted: 0,
      },
    }),
  ]);

  const remainingWhere: Prisma.UsbWhereInput = {
    deleted: 0,
    ...(usedQuestionIds.length > 0
      ? {
          id: {
            notIn: usedQuestionIds,
          },
        }
      : {}),
  };

  const [remainingQuestions, availableFirstQuestions] = await Promise.all([
    prisma.usb.count({
      where: remainingWhere,
    }),
    prisma.usb.count({
      where: {
        ...remainingWhere,
        asFirst: 1,
      },
    }),
  ]);

  const targetCount = getRandomQuestionTargetCount();
  const estimatedNewDays = Math.min(
    availableFirstQuestions,
    Math.floor(remainingQuestions / Math.max(targetCount, 1))
  );

  return {
    ...dateList,
    totalQuestions,
    usedQuestions: usedQuestionIds.length,
    remainingQuestions,
    availableFirstQuestions,
    estimatedNewDays,
  };
}

export async function getRandomQuestionSetByDate(showDate: string): Promise<RandomQuestionDetailResult | null> {
  const records = await prisma.randomUsb.findMany({
    where: {
      showDate: parseShowDate(showDate),
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  if (records.length === 0) {
    return null;
  }

  const questionRecords = await prisma.usb.findMany({
    where: {
      id: {
        in: records.map((record) => record.questionId),
      },
    },
  });
  const questionMap = new Map(questionRecords.map((record) => [record.id.toString(), buildQuestionDetailDto(record)]));

  const items: RandomQuestionStoredItem[] = records.map((record) => ({
    id: record.id.toString(),
    showDate: formatShowDate(record.showDate),
    questionId: record.questionId.toString(),
    questionUuid: record.questionUuid,
    asFirst: record.asFirst,
    category: record.category,
    sortOrder: record.sortOrder,
    question: questionMap.get(record.questionId.toString()) ?? null,
  }));

  const stats = buildPreviewStats(
    items.map((item) => ({
      questionId: item.questionId,
      questionUuid: item.questionUuid,
      asFirst: item.asFirst,
      category: item.category,
      sortOrder: item.sortOrder,
    }))
  );

  return {
    showDate,
    stats,
    items,
  };
}
