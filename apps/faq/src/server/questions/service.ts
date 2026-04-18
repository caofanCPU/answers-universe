import { prisma } from '@windrun-huaiin/backend-core/prisma';
import type { Prisma, Usb } from '@prisma/client';
import type {
  OuterQuestionBaseItemDto,
  OuterQuestionBaseResult,
} from '@windrun-huaiin/faq-contracts/outer/v1';
import { randomUUID } from 'node:crypto';
import type {
  OuterQuestionBaseQueryParams,
  QuestionExportItemDto,
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
  QUESTION_DEFAULT_DIFFICULTY,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
  type QuestionCategory,
  type QuestionDifficulty,
  type QuestionSubCategory,
} from './constants';
import {
  deleteOuterQuestionDetailCache,
  enqueueOuterQuestionDetailCacheRebuild,
  getOuterQuestionDetailCache,
  setOuterQuestionDetailCache,
} from './outer-cache';

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
    correctAnswer: record.correctAnswer,
    category: record.category as QuestionCategory,
    subCategory: record.subCategory,
    difficulty: record.difficulty as QuestionDifficulty,
    tags: parseTags(record.tags),
    keywords: parseKeywords(record.keywords),
    asFirst: record.asFirst === 1,
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

function buildOuterQuestionBaseItemDto(record: Usb): OuterQuestionBaseItemDto {
  return {
    id: record.id.toString(),
    uuid: record.questionUuid,
    question: record.question,
    category: record.category as QuestionCategory,
    subCategory: record.subCategory,
    difficulty: record.difficulty as QuestionDifficulty,
    asFirst: record.asFirst === 1,
    createdAt: toIsoString(record.createdAt ?? null),
    updatedAt: toIsoString(record.updatedAt ?? null),
  };
}

function buildOuterQuestionBaseItemFromDetailDto(record: QuestionDetailDto): OuterQuestionBaseItemDto {
  return {
    id: record.id,
    uuid: record.uuid,
    question: record.question,
    category: record.category,
    subCategory: record.subCategory,
    difficulty: record.difficulty,
    asFirst: record.asFirst,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
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
    asFirst: record.asFirst === 1,
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

function buildQuestionExportItemDto(
  record: Pick<Usb, 'id' | 'questionUuid' | 'category' | 'subCategory' | 'asFirst'>
): QuestionExportItemDto {
  return {
    id: record.id.toString(),
    questionUuid: record.questionUuid,
    category: record.category,
    subCategory: record.subCategory,
    asFirst: record.asFirst,
  };
}

function buildQuestionWhereInput(params: QuestionListParams): Prisma.UsbWhereInput {
  const id = params.id;
  const ids = params.ids;
  const uuid = params.uuid;
  const uuids = params.uuids;
  const question = params.question;
  const correctAnswer = params.correctAnswer;
  const asFirst = params.asFirst;
  const category = params.category;
  const subCategory = params.subCategory;
  const difficulty = params.difficulty;
  const createdAtFrom = params.createdAtFrom;
  const createdAtTo = params.createdAtTo;
  const updatedAtFrom = params.updatedAtFrom;
  const updatedAtTo = params.updatedAtTo;

  const andConditions: Prisma.UsbWhereInput[] = [];

  if (id) {
    andConditions.push({
      id,
    });
  }

  if (ids && ids.length > 0) {
    andConditions.push({
      id: {
        in: ids,
      },
    });
  }

  if (uuid) {
    andConditions.push({
      questionUuid: {
        equals: uuid,
      },
    });
  }

  if (uuids && uuids.length > 0) {
    andConditions.push({
      questionUuid: {
        in: uuids,
      },
    });
  }

  if (question) {
    andConditions.push({
      question: {
        startsWith: question,
        mode: 'insensitive',
      },
    });
  }

  if (correctAnswer) {
    andConditions.push({
      correctAnswer: {
        startsWith: correctAnswer,
        mode: 'insensitive',
      },
    });
  }

  if (typeof asFirst === 'boolean') {
    andConditions.push({
      asFirst: asFirst ? 1 : 0,
    });
  }

  if (category) {
    andConditions.push({
      category,
    });
  }

  if (subCategory) {
    andConditions.push({
      subCategory,
    });
  }

  if (difficulty) {
    andConditions.push({
      difficulty,
    });
  }

  if (createdAtFrom || createdAtTo) {
    andConditions.push({
      createdAt: {
        gte: createdAtFrom,
        lte: createdAtTo,
      },
    });
  }

  if (updatedAtFrom || updatedAtTo) {
    andConditions.push({
      updatedAt: {
        gte: updatedAtFrom,
        lte: updatedAtTo,
      },
    });
  }

  andConditions.unshift({
    deleted: 0,
  });

  return { AND: andConditions };
}

function buildQuestionCreateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedCreateInput {
  const difficulty = normalizeDifficulty(input.difficulty || QUESTION_DEFAULT_DIFFICULTY);
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
    asFirst: input.asFirst ? 1 : 0,
    tags: stringifyTags(input.tags),
    keywords: normalizeStringArray(input.keywords),
    createUserId: userId,
    updateUserId: userId,
  };
}

function buildQuestionUpdateInput(input: QuestionUpsertInput, userId: string): Prisma.UsbUncheckedUpdateInput {
  const difficulty = normalizeDifficulty(input.difficulty || QUESTION_DEFAULT_DIFFICULTY);
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
    asFirst: input.asFirst ? 1 : 0,
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

export async function getOuterQuestionDetailById(id: bigint): Promise<QuestionDetailDto | null> {
  const cacheKeyId = id.toString();
  const cached = await getOuterQuestionDetailCache(cacheKeyId);

  if (cached) {
    return cached;
  }

  const result = await getQuestionById(id);

  if (!result) {
    return null;
  }

  void enqueueOuterQuestionDetailCacheRebuild({
    questionId: cacheKeyId,
    reason: 'read_miss',
  });

  return result;
}

export async function getQuestionList(params: Partial<QuestionListParams>): Promise<QuestionListResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where = buildQuestionWhereInput({
    page,
    pageSize,
    id: params.id,
    ids: params.ids,
    uuid: params.uuid,
    uuids: params.uuids,
    question: params.question,
    correctAnswer: params.correctAnswer,
    asFirst: params.asFirst,
    category: params.category,
    subCategory: params.subCategory,
    difficulty: params.difficulty,
    createdAtFrom: params.createdAtFrom,
    createdAtTo: params.createdAtTo,
    updatedAtFrom: params.updatedAtFrom,
    updatedAtTo: params.updatedAtTo,
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

export async function getQuestionExportList(params: Partial<QuestionListParams>): Promise<QuestionExportItemDto[]> {
  const where = buildQuestionWhereInput({
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    id: params.id,
    ids: params.ids,
    uuid: params.uuid,
    uuids: params.uuids,
    question: params.question,
    correctAnswer: params.correctAnswer,
    asFirst: params.asFirst,
    category: params.category,
    subCategory: params.subCategory,
    difficulty: params.difficulty,
    createdAtFrom: params.createdAtFrom,
    createdAtTo: params.createdAtTo,
    updatedAtFrom: params.updatedAtFrom,
    updatedAtTo: params.updatedAtTo,
  });

  const records = await prisma.usb.findMany({
    where,
    select: {
      id: true,
      questionUuid: true,
      category: true,
      subCategory: true,
      asFirst: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return records.map(buildQuestionExportItemDto);
}

export async function getOuterQuestionBaseByIds(
  params: Partial<OuterQuestionBaseQueryParams>
): Promise<OuterQuestionBaseResult> {
  const ids = Array.from(new Set((params.ids ?? []).map((item) => item.toString())));

  if (ids.length === 0) {
    return {
      items: [],
    };
  }

  const cachedItems = new Map<string, OuterQuestionBaseItemDto>();
  const missedIds: bigint[] = [];

  for (const id of ids) {
    const cached = await getOuterQuestionDetailCache(id);

    if (cached) {
      cachedItems.set(id, buildOuterQuestionBaseItemFromDetailDto(cached));
      continue;
    }

    missedIds.push(BigInt(id));
  }

  if (missedIds.length > 0) {
    const records = await prisma.usb.findMany({
      where: {
        deleted: 0,
        id: {
          in: missedIds,
        },
      },
    });

    for (const record of records) {
      const detail = buildQuestionDetailDto(record);
      cachedItems.set(detail.id, buildOuterQuestionBaseItemFromDetailDto(detail));

      void enqueueOuterQuestionDetailCacheRebuild({
        questionId: detail.id,
        reason: 'read_miss',
      });
    }
  }

  const items = ids
    .map((id) => cachedItems.get(id) ?? null)
    .filter((item): item is OuterQuestionBaseItemDto => item !== null);

  return {
    items,
  };
}

export async function createQuestion(input: QuestionUpsertInput, userId: string): Promise<QuestionMutationResult> {
  const record = await prisma.usb.create({
    data: buildQuestionCreateInput(input, userId),
    select: {
      id: true,
    },
  });

  void enqueueOuterQuestionDetailCacheRebuild({
    questionId: record.id.toString(),
    reason: 'create',
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

  void enqueueOuterQuestionDetailCacheRebuild({
    questionId: record.id.toString(),
    reason: 'update',
  });

  return buildQuestionMutationResult(record);
}

export async function deleteQuestion(id: bigint, userId: string): Promise<QuestionMutationResult | null> {
  const exists = await prisma.usb.findUnique({
    where: { id },
    select: { id: true, deleted: true },
  });

  if (!exists || exists.deleted !== 0) {
    return null;
  }

  const record = await prisma.usb.update({
    where: { id },
    data: {
      deleted: 1,
      updateUserId: userId,
    },
    select: {
      id: true,
    },
  });

  void deleteOuterQuestionDetailCache(record.id.toString());
  void enqueueOuterQuestionDetailCacheRebuild({
    questionId: record.id.toString(),
    reason: 'delete',
    deleteOnly: true,
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

function randomInteger(maxExclusive: number): number {
  if (maxExclusive <= 1) {
    return 0;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function normalizeImportItemAliases(item: Record<string, unknown>): Record<string, unknown> {
  return {
    ...item,
    cdnImagePrefix: item.cdnImagePrefix ?? item.cdn_image_prefix,
    questionImage: item.questionImage ?? item.question_image,
    correctAnswer: item.correctAnswer ?? item.correct_answer,
    correctAnswerIndex: item.correctAnswerIndex ?? item.correct_answer_index,
    incorrectAnswers: item.incorrectAnswers ?? item.incorrect_answers,
    subCategory: item.subCategory ?? item.sub_category,
    asFirst: item.asFirst ?? item.as_first,
  };
}

type NormalizedQuestionImportDraft = Omit<
  QuestionImportValidationItem,
  'valid' | 'fieldErrors' | 'globalErrors' | 'payload'
>;

type QuestionImportFieldErrors = QuestionImportValidationItem['fieldErrors'];

type FieldValidator = (
  draft: NormalizedQuestionImportDraft,
  source: Record<string, unknown>
) => Partial<QuestionImportFieldErrors>;

function normalizeQuestionImportDraft(item: Record<string, unknown>, index: number): NormalizedQuestionImportDraft {
  const normalizedItem = normalizeImportItemAliases(item);
  const importId =
    typeof normalizedItem.importId === 'string' && normalizedItem.importId.trim().length > 0
      ? normalizedItem.importId.trim()
      : `import-${index + 1}`;

  const question = isNonEmptyString(normalizedItem.question) ? normalizedItem.question.trim() : '';
  const cdnImagePrefix = typeof normalizedItem.cdnImagePrefix === 'string' ? normalizedItem.cdnImagePrefix.trim() : '';
  const questionImage = typeof normalizedItem.questionImage === 'string' ? normalizedItem.questionImage.trim() : '';
  const category = isNonEmptyString(normalizedItem.category) ? normalizeCategory(normalizedItem.category) : null;
  const subCategory = isNonEmptyString(normalizedItem.subCategory) ? normalizeSubCategory(normalizedItem.subCategory) : null;
  const difficulty = isNonEmptyString(normalizedItem.difficulty) ? normalizeDifficulty(normalizedItem.difficulty) : null;
  const correctAnswer = isNonEmptyString(normalizedItem.correctAnswer) ? normalizedItem.correctAnswer.trim() : '';
  const correctAnswerIndex = toInteger(normalizedItem.correctAnswerIndex);
  const explanation = isNonEmptyString(normalizedItem.explanation) ? normalizedItem.explanation.trim() : '';
  const incorrectAnswers = toStringArray(normalizedItem.incorrectAnswers);
  const tags = toStringArray(normalizedItem.tags);
  const keywords = toStringArray(normalizedItem.keywords);
  const asFirst = Boolean(normalizedItem.asFirst);

  return {
    importId,
    index,
    question,
    cdnImagePrefix,
    questionImage,
    correctAnswer,
    correctAnswerIndex,
    incorrectAnswers,
    explanation,
    difficulty: difficulty ?? QUESTION_DEFAULT_DIFFICULTY,
    category: category ?? '',
    subCategory,
    tags,
    keywords,
    asFirst,
  };
}

const questionImportFieldValidators: FieldValidator[] = [
  (draft) => (!draft.question ? { question: 'question is required' } : {}),
  (draft) =>
    !draft.category ? { category: `category must be one of: ${QUESTION_CATEGORIES.join(', ')}` } : {},
  (_draft, source) =>
    isNonEmptyString(source.subCategory) && !normalizeSubCategory(source.subCategory)
      ? { subCategory: `subCategory must be one of: ${QUESTION_SUB_CATEGORIES.join(', ')}` }
      : {},
  (_draft, source) =>
    isNonEmptyString(source.difficulty) && !normalizeDifficulty(source.difficulty)
      ? { difficulty: `difficulty must be one of: ${QUESTION_DIFFICULTIES.join(', ')}` }
      : {},
  (draft) => (!draft.correctAnswer ? { correctAnswer: 'correctAnswer is required' } : {}),
  (draft) => (!draft.explanation ? { explanation: 'explanation is required' } : {}),
  (draft) =>
    draft.incorrectAnswers.length === 0 ? { incorrectAnswers: 'incorrectAnswers must contain at least one answer' } : {},
];

function validateQuestionImportFieldErrors(
  draft: NormalizedQuestionImportDraft,
  source: Record<string, unknown>
): QuestionImportFieldErrors {
  return questionImportFieldValidators.reduce<QuestionImportFieldErrors>(
    (errors, validator) => ({ ...errors, ...validator(draft, source) }),
    {}
  );
}

function buildQuestionImportPayload(
  draft: NormalizedQuestionImportDraft,
  fieldErrors: QuestionImportFieldErrors
): QuestionUpsertInput | null {
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const totalOptions = (draft.correctAnswer ? 1 : 0) + draft.incorrectAnswers.length;
  const normalizedCorrectAnswerIndex =
    totalOptions <= 0 ||
    typeof draft.correctAnswerIndex !== 'number' ||
    !Number.isInteger(draft.correctAnswerIndex) ||
    draft.correctAnswerIndex < 0 ||
    draft.correctAnswerIndex >= totalOptions
      ? randomInteger(totalOptions)
      : draft.correctAnswerIndex;

  const payload: QuestionUpsertInput | null =
    !hasFieldErrors && draft.category
      ? {
          question: draft.question,
          cdnImagePrefix: normalizeNullableString(draft.cdnImagePrefix),
          questionImage: normalizeNullableString(draft.questionImage),
          correctAnswer: draft.correctAnswer,
          correctAnswerIndex: normalizedCorrectAnswerIndex,
          incorrectAnswers: draft.incorrectAnswers,
          explanation: draft.explanation,
          difficulty: draft.difficulty || QUESTION_DEFAULT_DIFFICULTY,
          category: draft.category,
          subCategory: draft.subCategory,
          tags: draft.tags,
          keywords: draft.keywords,
          asFirst: draft.asFirst,
        }
      : null;

  return payload;
}

export function validateQuestionImportItem(item: Record<string, unknown>, index: number): QuestionImportValidationItem {
  const normalizedItem = normalizeImportItemAliases(item);
  const draft = normalizeQuestionImportDraft(normalizedItem, index);
  const fieldErrors = validateQuestionImportFieldErrors(draft, normalizedItem);
  const globalErrors: string[] = [];
  const payload = buildQuestionImportPayload(draft, fieldErrors);

  return {
    ...draft,
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    globalErrors,
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
  const importedImportIds: string[] = [];
  const importedQuestionIds: string[] = [];

  for (const item of validation.items) {
    if (!item.payload) {
      continue;
    }

    const created = await prisma.usb.create({
      data: buildQuestionCreateInput(item.payload, userId),
      select: { id: true },
    });

    importedQuestionIds.push(created.id.toString());
    importedImportIds.push(item.importId);
  }

  for (const questionId of importedQuestionIds) {
    void enqueueOuterQuestionDetailCacheRebuild({
      questionId,
      reason: 'import',
    });
  }

  return {
    total: validation.total,
    successCount: importedImportIds.length,
    failedCount: validation.total - importedImportIds.length,
    importedImportIds,
    items: validation.items.map(({ payload: _payload, ...rest }) => ({ ...rest, payload: null })),
  };
}

export async function rebuildOuterQuestionDetailCache(questionId: bigint): Promise<'rebuilt' | 'deleted' | 'missing'> {
  const result = await getQuestionById(questionId);

  if (!result) {
    await deleteOuterQuestionDetailCache(questionId.toString());
    return 'missing';
  }

  await setOuterQuestionDetailCache(questionId.toString(), result);
  return 'rebuilt';
}
