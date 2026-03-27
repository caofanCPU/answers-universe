import { prisma } from '@windrun-huaiin/backend-core/prisma';
import type { Prisma, Usb } from '@windrun-huaiin/backend-core/prisma/client';
import type {
  QuestionImportCommitResult,
  QuestionImportValidationItem,
  QuestionImportValidationResult,
  QuestionDetailDto,
  QuestionListItemDto,
  QuestionListParams,
  QuestionListResult,
  QuestionUpsertInput,
} from './types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePage(value?: number): number {
  if (!value || value < 1) {
    return DEFAULT_PAGE;
  }
  return Math.floor(value);
}

function normalizePageSize(value?: number): number {
  if (!value || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags) {
    return [];
  }

  return tags
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseTags(raw: string): string[] {
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(/[,，\n\r\t|]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function stringifyTags(tags?: string[]): string {
  return normalizeTags(tags).join(',');
}

function parseIncorrectAnswers(raw: Prisma.JsonValue): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildQuestionImageUrl(cdnImagePrefix: string | null, questionImage: string | null): string | null {
  if (!questionImage) {
    return null;
  }

  if (!cdnImagePrefix) {
    return questionImage;
  }

  const prefix = cdnImagePrefix.endsWith('/') ? cdnImagePrefix.slice(0, -1) : cdnImagePrefix;
  const path = questionImage.startsWith('/') ? questionImage.slice(1) : questionImage;
  return `${prefix}/${path}`;
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function buildQuestionListItemDto(record: Usb): QuestionListItemDto {
  return {
    id: record.id.toString(),
    question: record.question,
    category: record.category,
    subCategory: record.subCategory,
    difficulty: record.difficulty,
    tags: parseTags(record.tags),
    isFirst: record.asFirst === 1,
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

export function buildQuestionDetailDto(record: Usb): QuestionDetailDto {
  return {
    id: record.id.toString(),
    question: record.question,
    cdnImagePrefix: record.cdnImagePrefix ?? null,
    questionImage: record.questionImage ?? null,
    questionImageUrl: buildQuestionImageUrl(record.cdnImagePrefix ?? null, record.questionImage ?? null),
    correctAnswer: record.correctAnswer,
    incorrectAnswers: parseIncorrectAnswers(record.incorrectAnswers),
    explanation: record.explanation,
    difficulty: record.difficulty,
    category: record.category,
    subCategory: record.subCategory,
    isFirst: record.asFirst === 1,
    tags: parseTags(record.tags),
    createdAt: toIsoString(record.createdAt ?? null),
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

function buildQuestionWhereInput(params: QuestionListParams): Prisma.UsbWhereInput {
  const keyword = params.keyword?.trim();
  const category = params.category?.trim();
  const difficulty = params.difficulty?.trim();
  const tags = normalizeTags(params.tags);

  const andConditions: Prisma.UsbWhereInput[] = [];

  if (keyword) {
    andConditions.push({
      question: {
        contains: keyword,
        mode: 'insensitive',
      },
    });
  }

  if (category) {
    andConditions.push({
      category: {
        equals: category,
        mode: 'insensitive',
      },
    });
  }

  if (difficulty) {
    andConditions.push({
      difficulty: {
        equals: difficulty,
        mode: 'insensitive',
      },
    });
  }

  for (const tag of tags) {
    andConditions.push({
      tags: {
        contains: tag,
        mode: 'insensitive',
      },
    });
  }

  if (andConditions.length === 0) {
    return {};
  }

  return { AND: andConditions };
}

function buildQuestionCreateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedCreateInput {
  return {
    question: input.question.trim(),
    cdnImagePrefix: normalizeNullableString(input.cdnImagePrefix),
    questionImage: normalizeNullableString(input.questionImage),
    correctAnswer: input.correctAnswer.trim(),
    incorrectAnswers: input.incorrectAnswers.map((item) => item.trim()).filter(Boolean),
    explanation: input.explanation.trim(),
    difficulty: input.difficulty.trim(),
    category: input.category.trim(),
    subCategory: input.subCategory.trim(),
    asFirst: input.isFirst ? 1 : 0,
    tags: stringifyTags(input.tags),
    createUserId: userId,
    updateUserId: userId,
  };
}

function buildQuestionUpdateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedUpdateInput {
  return {
    question: input.question.trim(),
    cdnImagePrefix: normalizeNullableString(input.cdnImagePrefix),
    questionImage: normalizeNullableString(input.questionImage),
    correctAnswer: input.correctAnswer.trim(),
    incorrectAnswers: input.incorrectAnswers.map((item) => item.trim()).filter(Boolean),
    explanation: input.explanation.trim(),
    difficulty: input.difficulty.trim(),
    category: input.category.trim(),
    subCategory: input.subCategory.trim(),
    asFirst: input.isFirst ? 1 : 0,
    tags: stringifyTags(input.tags),
    updateUserId: userId,
  };
}

export async function getQuestionById(id: bigint): Promise<QuestionDetailDto | null> {
  const record = await prisma.usb.findUnique({
    where: { id },
  });

  return record ? buildQuestionDetailDto(record) : null;
}

export async function getQuestionList(params: Partial<QuestionListParams>): Promise<QuestionListResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where = buildQuestionWhereInput({
    page,
    pageSize,
    keyword: params.keyword,
    category: params.category,
    difficulty: params.difficulty,
    tags: params.tags,
  });

  const skip = (page - 1) * pageSize;

  const [records, total] = await Promise.all([
    prisma.usb.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.usb.count({ where }),
  ]);

  return {
    items: records.map(buildQuestionListItemDto),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function createQuestion(input: QuestionUpsertInput, userId: string): Promise<QuestionDetailDto> {
  const record = await prisma.usb.create({
    data: buildQuestionCreateInput(input, userId),
  });

  return buildQuestionDetailDto(record);
}

export async function updateQuestion(
  id: bigint,
  input: QuestionUpsertInput,
  userId: string
): Promise<QuestionDetailDto | null> {
  const exists = await prisma.usb.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return null;
  }

  const record = await prisma.usb.update({
    where: { id },
    data: buildQuestionUpdateInput(input, userId),
  });

  return buildQuestionDetailDto(record);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function validateQuestionImportItem(item: Record<string, unknown>, index: number): QuestionImportValidationItem {
  const errors: string[] = [];

  const question = isNonEmptyString(item.question) ? item.question.trim() : '';
  const category = isNonEmptyString(item.category) ? item.category.trim() : '';
  const subCategory = isNonEmptyString(item.subCategory) ? item.subCategory.trim() : '';
  const difficulty = isNonEmptyString(item.difficulty) ? item.difficulty.trim() : '';
  const correctAnswer = isNonEmptyString(item.correctAnswer) ? item.correctAnswer.trim() : '';
  const explanation = isNonEmptyString(item.explanation) ? item.explanation.trim() : '';
  const incorrectAnswers = toStringArray(item.incorrectAnswers);
  const tags = toStringArray(item.tags);

  if (!question) errors.push('question is required');
  if (!category) errors.push('category is required');
  if (!subCategory) errors.push('subCategory is required');
  if (!difficulty) errors.push('difficulty is required');
  if (!correctAnswer) errors.push('correctAnswer is required');
  if (!explanation) errors.push('explanation is required');
  if (incorrectAnswers.length === 0) errors.push('incorrectAnswers must contain at least one answer');

  const payload: QuestionUpsertInput | null =
    errors.length === 0
      ? {
          question,
          cdnImagePrefix: normalizeNullableString(typeof item.cdnImagePrefix === 'string' ? item.cdnImagePrefix : null),
          questionImage: normalizeNullableString(typeof item.questionImage === 'string' ? item.questionImage : null),
          correctAnswer,
          incorrectAnswers,
          explanation,
          difficulty,
          category,
          subCategory,
          tags,
          isFirst: Boolean(item.isFirst),
        }
      : null;

  return {
    index,
    valid: errors.length === 0,
    errors,
    question,
    category,
    subCategory,
    difficulty,
    tags,
    payload,
  };
}

export function validateQuestionImportItems(items: Record<string, unknown>[]): QuestionImportValidationResult {
  const results = items.map((item, index) => validateQuestionImportItem(item, index));
  const validCount = results.filter((item) => item.valid).length;
  const invalidCount = results.length - validCount;

  return {
    total: results.length,
    validCount,
    invalidCount,
    items: results,
  };
}

export async function importQuestions(
  items: Record<string, unknown>[],
  userId: string
): Promise<QuestionImportCommitResult> {
  const validation = validateQuestionImportItems(items);
  const createdIds: string[] = [];

  for (const item of validation.items) {
    if (!item.payload) {
      continue;
    }

    const created = await prisma.usb.create({
      data: buildQuestionCreateInput(item.payload, userId),
      select: { id: true },
    });

    createdIds.push(created.id.toString());
  }

  return {
    total: validation.total,
    successCount: createdIds.length,
    failedCount: validation.total - createdIds.length,
    createdIds,
    items: validation.items.map(({ payload: _payload, ...rest }) => rest),
  };
}
