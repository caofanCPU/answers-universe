import { prisma } from '@/server/prisma';
import type { Prisma, Usb } from '@app-prisma';
import { buildQuestionDetailDto } from '@/server/questions/service';
import type {
  RandomQuestionAnalysisResult,
  RandomQuestionBulkCommitResult,
  RandomQuestionCategoryInventory,
  RandomQuestionCommitResult,
  RandomQuestionDateListResult,
  RandomQuestionDateSummary,
  RandomQuestionDetailResult,
  RandomQuestionDraftItem,
  RandomQuestionPlanRangeResult,
  RandomQuestionPlannedDateResult,
  RandomQuestionPlannedGroup,
  RandomQuestionPreviewItem,
  RandomQuestionPreviewResult,
  RandomQuestionPreviewStats,
  RandomQuestionReason,
  RandomQuestionStoredItem,
} from './types';
import { selectBestRandomQuestionSet } from '@/lib/random-question-planner';

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

function addDaysToShowDate(showDate: string, days: number): string {
  const date = parseShowDate(showDate);
  date.setUTCDate(date.getUTCDate() + days);
  return formatShowDate(date);
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

async function attachPlannedGroupDetails(groups: RandomQuestionPlannedGroup[]): Promise<RandomQuestionPlannedGroup[]> {
  const questionIds = [
    ...new Set(groups.flatMap((group) => group.items.map((item) => item.questionId))),
  ];

  if (questionIds.length === 0) {
    return groups;
  }

  const questionRecords = await prisma.usb.findMany({
    where: {
      id: {
        in: questionIds.map((value) => BigInt(value)),
      },
    },
  });
  const questionMap = new Map(questionRecords.map((record) => [record.id.toString(), buildQuestionDetailDto(record)]));

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      question: questionMap.get(item.questionId) ?? null,
    })),
  }));
}

type RandomQuestionSelectionRecord = Pick<Usb, 'id' | 'questionUuid' | 'asFirst' | 'category'>;

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

async function getBestQuestionSet(
  usedQuestionIds: bigint[],
  showDate: string
): Promise<ReturnType<typeof selectBestRandomQuestionSet<RandomQuestionSelectionRecord>>> {
  const baseWhere: Prisma.UsbWhereInput = {
    deleted: 0,
    ...(usedQuestionIds.length > 0
      ? {
          id: {
            notIn: usedQuestionIds,
          },
        }
      : {}),
  };
  const [firstQuestions, normalQuestions] = await Promise.all([
    prisma.usb.findMany({
      where: {
        ...baseWhere,
        asFirst: 1,
      },
      select: {
        id: true,
        questionUuid: true,
        asFirst: true,
        category: true,
      },
    }),
    prisma.usb.findMany({
      where: {
        ...baseWhere,
        asFirst: 0,
      },
      select: {
        id: true,
        questionUuid: true,
        asFirst: true,
        category: true,
      },
    }),
  ]);

  return selectBestRandomQuestionSet({
    firstQuestions,
    normalQuestions,
    showDate,
    targetTotal: getRandomQuestionTargetCount(),
  });
}

function buildPlannedGroupsWithPlanner({
  firstQuestions,
  normalQuestions,
  targetCount,
}: {
  firstQuestions: RandomQuestionSelectionRecord[];
  normalQuestions: RandomQuestionSelectionRecord[];
  targetCount: number;
}): RandomQuestionPlannedGroup[] {
  const remainingFirstQuestions = [...firstQuestions];
  const remainingNormalQuestions = [...normalQuestions];
  const plannedGroups: RandomQuestionPlannedGroup[] = [];

  while (remainingFirstQuestions.length > 0 && remainingNormalQuestions.length >= Math.max(targetCount - 1, 0)) {
    const planIndex = plannedGroups.length + 1;
    const candidateSet = selectBestRandomQuestionSet({
      firstQuestions: remainingFirstQuestions,
      normalQuestions: remainingNormalQuestions,
      showDate: `plan-${planIndex}`,
      targetTotal: targetCount,
    });

    if (!candidateSet || candidateSet.normalQuestions.length < Math.max(targetCount - 1, 0)) {
      break;
    }

    const items = [
      buildDraftItem(candidateSet.firstQuestion, 1),
      ...candidateSet.normalQuestions.map((item, index) => buildDraftItem(item, index + 2)),
    ];
    const stats = buildPreviewStats(items);
    const usedIds = new Set(items.map((item) => item.questionId));

    plannedGroups.push({
      planId: `plan-${planIndex}`,
      targetCount,
      canCommit: stats.actualTotal === stats.targetTotal && stats.actualFirstCount === stats.targetFirstCount,
      reasons: [],
      messages: [],
      stats,
      items: items.map((item) => ({
        ...item,
        question: null,
      })),
    });

    for (let index = remainingFirstQuestions.length - 1; index >= 0; index -= 1) {
      if (usedIds.has(remainingFirstQuestions[index].id.toString())) {
        remainingFirstQuestions.splice(index, 1);
      }
    }

    for (let index = remainingNormalQuestions.length - 1; index >= 0; index -= 1) {
      if (usedIds.has(remainingNormalQuestions[index].id.toString())) {
        remainingNormalQuestions.splice(index, 1);
      }
    }
  }

  return plannedGroups;
}

function buildCategoryInventory(records: RandomQuestionSelectionRecord[]): RandomQuestionCategoryInventory[] {
  const inventoryByCategory = new Map<string, RandomQuestionCategoryInventory>();

  for (const record of records) {
    const existing = inventoryByCategory.get(record.category) ?? {
      category: record.category,
      firstCount: 0,
      normalCount: 0,
      totalCount: 0,
    };

    if (record.asFirst === 1) {
      existing.firstCount += 1;
    } else {
      existing.normalCount += 1;
    }

    existing.totalCount += 1;
    inventoryByCategory.set(record.category, existing);
  }

  return [...inventoryByCategory.values()].sort((left, right) => {
    if (left.totalCount !== right.totalCount) {
      return right.totalCount - left.totalCount;
    }

    return left.category.localeCompare(right.category);
  });
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
  const candidateSet = await getBestQuestionSet(usedQuestionIds, showDate);

  if (!candidateSet) {
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

  const items = [
    buildDraftItem(candidateSet.firstQuestion, 1),
    ...candidateSet.normalQuestions.map((item, index) => buildDraftItem(item, index + 2)),
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

export async function commitRandomQuestionSets(
  plans: Array<{
    showDate: string;
    items: RandomQuestionDraftItem[];
  }>
): Promise<RandomQuestionBulkCommitResult> {
  if (plans.length === 0) {
    return {
      saved: true,
      dates: [],
    };
  }

  const showDates = plans.map((plan) => plan.showDate);
  const uniqueShowDates = new Set(showDates);

  if (uniqueShowDates.size !== showDates.length) {
    throw new Error('Duplicate showDate in bulk commit request');
  }

  for (const plan of plans) {
    validateDraftItems(plan.showDate, plan.items);
  }

  const existingRecords = await prisma.randomUsb.findMany({
    where: {
      showDate: {
        in: showDates.map(parseShowDate),
      },
    },
    select: {
      showDate: true,
    },
  });

  if (existingRecords.length > 0) {
    throw new Error(`Random question set already exists for ${formatShowDate(existingRecords[0].showDate)}`);
  }

  await prisma.randomUsb.createMany({
    data: plans.flatMap((plan) => buildRandomUsbCreateManyData(plan.showDate, plan.items)),
  });

  return {
    saved: true,
    dates: plans.map((plan) => ({
      saved: true,
      showDate: plan.showDate,
      count: plan.items.length,
    })),
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

  const [remainingQuestions, availableFirstQuestions, plannerRecords] = await Promise.all([
    prisma.usb.count({
      where: remainingWhere,
    }),
    prisma.usb.count({
      where: {
        ...remainingWhere,
        asFirst: 1,
      },
    }),
    prisma.usb.findMany({
      where: remainingWhere,
      select: {
        id: true,
        questionUuid: true,
        asFirst: true,
        category: true,
      },
    }),
  ]);

  const targetCount = getRandomQuestionTargetCount();
  const firstPlannerRecords = plannerRecords.filter((record) => record.asFirst === 1);
  const normalPlannerRecords = plannerRecords.filter((record) => record.asFirst === 0);
  const estimatedNewDays = buildPlannedGroupsWithPlanner({
    firstQuestions: firstPlannerRecords,
    normalQuestions: normalPlannerRecords,
    targetCount,
  }).length;
  const categoryInventory = buildCategoryInventory(plannerRecords);

  return {
    ...dateList,
    totalQuestions,
    usedQuestions: usedQuestionIds.length,
    remainingQuestions,
    availableFirstQuestions,
    estimatedNewDays,
    categoryInventory,
  };
}

export async function planRandomQuestionRange(startDate: string, endDate: string): Promise<RandomQuestionPlanRangeResult> {
  const normalizedStartDate = startDate <= endDate ? startDate : endDate;
  const normalizedEndDate = startDate <= endDate ? endDate : startDate;
  const requestedDays = Math.max(
    0,
    Math.floor((parseShowDate(normalizedEndDate).getTime() - parseShowDate(normalizedStartDate).getTime()) / 86400000) + 1
  );

  if (requestedDays <= 0) {
    return {
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      requestedDays: 0,
      plannedDates: [],
    };
  }

  const [usedQuestionIds, occupiedDates] = await Promise.all([
    getUsedQuestionIds(),
    listRandomQuestionDates(),
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

  const plannerPool = await prisma.usb.findMany({
    where: remainingWhere,
    select: {
      id: true,
      questionUuid: true,
      asFirst: true,
      category: true,
    },
  });

  const targetCount = getRandomQuestionTargetCount();
  const plannedGroups = await attachPlannedGroupDetails(buildPlannedGroupsWithPlanner({
    firstQuestions: plannerPool.filter((record) => record.asFirst === 1),
    normalQuestions: plannerPool.filter((record) => record.asFirst === 0),
    targetCount,
  }));

  const occupiedDateSet = new Set(occupiedDates.dates.map((item) => item.showDate));
  const plannedDates: RandomQuestionPlannedDateResult[] = [];
  let cursor = normalizedStartDate;
  let groupIndex = 0;

  while (plannedDates.length < requestedDays && groupIndex < plannedGroups.length) {
    if (!occupiedDateSet.has(cursor)) {
      const group = plannedGroups[groupIndex];
      plannedDates.push({
        showDate: cursor,
        planId: group.planId,
        targetCount: group.targetCount,
        canCommit: group.canCommit,
        reasons: group.reasons,
        messages: group.messages,
        stats: group.stats,
        items: group.items,
      });
      groupIndex += 1;
    }

    cursor = addDaysToShowDate(cursor, 1);
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    requestedDays,
    plannedDates,
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
