import { prisma } from '@windrun-huaiin/backend-core/prisma';
import type { Prisma, Usb } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type {
  QuestionImportCommitResult,
  QuestionImportValidationItem,
  QuestionImportValidationResult,
  QuestionDetailDto,
  QuestionListItemDto,
  QuestionListParams,
  QuestionListResult,
  QuestionMutationResult,
  QuestionUpsertInput,
} from './types';
import {
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
  type QuestionCategory,
  type QuestionDifficulty,
  type QuestionSubCategory,
} from './constants';

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

function normalizeStringArray(values?: string[]): string[] {
  if (!values) {
    return [];
  }

  return values
    .map((value) => value.trim())
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

function parseJsonStringArray(raw: Prisma.JsonValue): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseIncorrectAnswers(raw: Prisma.JsonValue): string[] {
  return parseJsonStringArray(raw);
}

function normalizeCorrectAnswerIndex(
  value: number | null | undefined,
  correctAnswer: string,
  incorrectAnswers: string[]
): number {
  const totalOptions = (correctAnswer.trim() ? 1 : 0) + incorrectAnswers.length;

  if (totalOptions <= 0) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= totalOptions) {
    return 0;
  }

  return value;
}

function parseKeywords(raw: Prisma.JsonValue | null): string[] {
  if (!raw) {
    return [];
  }

  return parseJsonStringArray(raw);
}

function normalizeDifficulty(value: string): QuestionDifficulty | null {
  const normalized = value.trim().toLowerCase();
  return QUESTION_DIFFICULTIES.find((item) => item === normalized) ?? null;
}

function normalizeCategory(value: string): QuestionCategory | null {
  const normalized = value.trim().toLowerCase();

  return (
    QUESTION_CATEGORIES.find((item) => item.toLowerCase() === normalized) ?? null
  );
}

function normalizeSubCategory(value: string): QuestionSubCategory | null {
  const normalized = value.trim().toLowerCase();
  return QUESTION_SUB_CATEGORIES.find((item) => item === normalized) ?? null;
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
    uuid: record.questionUuid,
    question: record.question,
    category: record.category as QuestionCategory,
    subCategory: record.subCategory,
    difficulty: record.difficulty as QuestionDifficulty,
    tags: parseTags(record.tags),
    keywords: parseKeywords(record.keywords),
    isFirst: record.asFirst === 1,
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

export function buildQuestionDetailDto(record: Usb): QuestionDetailDto {
  const incorrectAnswers = parseIncorrectAnswers(record.incorrectAnswers);

  return {
    id: record.id.toString(),
    uuid: record.questionUuid,
    question: record.question,
    cdnImagePrefix: record.cdnImagePrefix ?? null,
    questionImage: record.questionImage ?? null,
    questionImageUrl: buildQuestionImageUrl(record.cdnImagePrefix ?? null, record.questionImage ?? null),
    correctAnswer: record.correctAnswer,
    correctAnswerIndex: normalizeCorrectAnswerIndex(record.correctAnswerIndex, record.correctAnswer, incorrectAnswers),
    incorrectAnswers,
    explanation: record.explanation,
    difficulty: record.difficulty as QuestionDifficulty,
    category: record.category as QuestionCategory,
    subCategory: record.subCategory,
    isFirst: record.asFirst === 1,
    tags: parseTags(record.tags),
    keywords: parseKeywords(record.keywords),
    createdAt: toIsoString(record.createdAt ?? null),
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

function buildQuestionMutationResult(record: Pick<Usb, 'id'>): QuestionMutationResult {
  return {
    id: record.id.toString(),
  };
}

function buildQuestionWhereInput(params: QuestionListParams): Prisma.UsbWhereInput {
  const category = params.category;
  const subCategory = params.subCategory;
  const difficulty = params.difficulty;

  const andConditions: Prisma.UsbWhereInput[] = [];

  if (category) {
    andConditions.push({
      category: {
        equals: category,
        mode: 'insensitive',
      },
    });
  }

  if (subCategory) {
    andConditions.push({
      subCategory: {
        equals: subCategory,
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

  andConditions.unshift({
    deleted: 0,
  });

  return { AND: andConditions };
}

function buildQuestionCreateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedCreateInput {
  const difficulty = normalizeDifficulty(input.difficulty);
  const category = normalizeCategory(input.category);
  const subCategory = input.subCategory ? normalizeSubCategory(input.subCategory) : null;
  const incorrectAnswers = normalizeStringArray(input.incorrectAnswers);
  const correctAnswer = input.correctAnswer.trim();

  if (!difficulty) {
    throw new Error(`Invalid difficulty: ${input.difficulty}`);
  }

  if (!category) {
    throw new Error(`Invalid category: ${input.category}`);
  }

  return {
    questionUuid: randomUUID(),
    question: input.question.trim(),
    cdnImagePrefix: normalizeNullableString(input.cdnImagePrefix),
    questionImage: normalizeNullableString(input.questionImage),
    correctAnswer,
    correctAnswerIndex: normalizeCorrectAnswerIndex(input.correctAnswerIndex, correctAnswer, incorrectAnswers),
    incorrectAnswers,
    explanation: input.explanation.trim(),
    difficulty,
    category,
    subCategory: subCategory ?? null,
    asFirst: input.isFirst ? 1 : 0,
    tags: stringifyTags(input.tags),
    keywords: normalizeStringArray(input.keywords),
    createUserId: userId,
    updateUserId: userId,
  };
}

function buildQuestionUpdateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedUpdateInput {
  const difficulty = normalizeDifficulty(input.difficulty);
  const category = normalizeCategory(input.category);
  const subCategory = input.subCategory ? normalizeSubCategory(input.subCategory) : null;
  const incorrectAnswers = normalizeStringArray(input.incorrectAnswers);
  const correctAnswer = input.correctAnswer.trim();

  if (!difficulty) {
    throw new Error(`Invalid difficulty: ${input.difficulty}`);
  }

  if (!category) {
    throw new Error(`Invalid category: ${input.category}`);
  }

  return {
    question: input.question.trim(),
    cdnImagePrefix: normalizeNullableString(input.cdnImagePrefix),
    questionImage: normalizeNullableString(input.questionImage),
    correctAnswer,
    correctAnswerIndex: normalizeCorrectAnswerIndex(input.correctAnswerIndex, correctAnswer, incorrectAnswers),
    incorrectAnswers,
    explanation: input.explanation.trim(),
    difficulty,
    category,
    subCategory: subCategory ?? null,
    asFirst: input.isFirst ? 1 : 0,
    tags: stringifyTags(input.tags),
    keywords: normalizeStringArray(input.keywords),
    updateUserId: userId,
  };
}

export async function getQuestionById(id: bigint): Promise<QuestionDetailDto | null> {
  const record = await prisma.usb.findUnique({
    where: { id },
  });

  return record && record.deleted === 0 ? buildQuestionDetailDto(record) : null;
}

export async function getQuestionList(params: Partial<QuestionListParams>): Promise<QuestionListResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where = buildQuestionWhereInput({
    page,
    pageSize,
    category: params.category,
    subCategory: params.subCategory,
    difficulty: params.difficulty,
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

export async function createQuestion(input: QuestionUpsertInput, userId: string): Promise<QuestionMutationResult> {
  const record = await prisma.usb.create({
    data: buildQuestionCreateInput(input, userId),
    select: {
      id: true,
    },
  });

  return buildQuestionMutationResult(record);
}

export async function updateQuestion(
  id: bigint,
  input: QuestionUpsertInput,
  userId: string
): Promise<QuestionMutationResult | null> {
  const exists = await prisma.usb.findUnique({
    where: { id },
    select: { id: true, deleted: true },
  });

  if (!exists || exists.deleted !== 0) {
    return null;
  }

  const record = await prisma.usb.update({
    where: { id },
    data: buildQuestionUpdateInput(input, userId),
    select: {
      id: true,
    },
  });

  return buildQuestionMutationResult(record);
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

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
}

export function validateQuestionImportItem(item: Record<string, unknown>, index: number): QuestionImportValidationItem {
  const errors: string[] = [];

  const question = isNonEmptyString(item.question) ? item.question.trim() : '';
  const category = isNonEmptyString(item.category) ? normalizeCategory(item.category) : null;
  const subCategory = isNonEmptyString(item.subCategory) ? normalizeSubCategory(item.subCategory) : null;
  const difficulty = isNonEmptyString(item.difficulty) ? normalizeDifficulty(item.difficulty) : null;
  const correctAnswer = isNonEmptyString(item.correctAnswer) ? item.correctAnswer.trim() : '';
  const correctAnswerIndex = toInteger(item.correctAnswerIndex);
  const explanation = isNonEmptyString(item.explanation) ? item.explanation.trim() : '';
  const incorrectAnswers = toStringArray(item.incorrectAnswers);
  const tags = toStringArray(item.tags);
  const keywords = toStringArray(item.keywords);

  if (!question) errors.push('question is required');
  if (!category) errors.push(`category must be one of: ${QUESTION_CATEGORIES.join(', ')}`);
  if (!difficulty) errors.push(`difficulty must be one of: ${QUESTION_DIFFICULTIES.join(', ')}`);
  if (!correctAnswer) errors.push('correctAnswer is required');
  if (item.correctAnswerIndex !== undefined && correctAnswerIndex === null) {
    errors.push('correctAnswerIndex must be an integer');
  }
  if (!explanation) errors.push('explanation is required');
  if (incorrectAnswers.length === 0) errors.push('incorrectAnswers must contain at least one answer');

  const payload: QuestionUpsertInput | null =
    errors.length === 0 && category && difficulty
      ? {
          question,
          cdnImagePrefix: normalizeNullableString(typeof item.cdnImagePrefix === 'string' ? item.cdnImagePrefix : null),
          questionImage: normalizeNullableString(typeof item.questionImage === 'string' ? item.questionImage : null),
          correctAnswer,
          correctAnswerIndex: correctAnswerIndex ?? 0,
          incorrectAnswers,
          explanation,
          difficulty,
          category,
          subCategory,
          tags,
          keywords,
          isFirst: Boolean(item.isFirst),
        }
      : null;

  return {
    index,
    valid: errors.length === 0,
    errors,
    question,
    category: category ?? '',
    subCategory,
    difficulty: difficulty ?? '',
    tags,
    keywords,
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
