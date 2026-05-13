import { z } from 'zod';
import {
  QUESTION_CATEGORIES,
  QUESTION_DEFAULT_DIFFICULTY,
  QUESTION_DIFFICULTIES,
  QUESTION_SUB_CATEGORIES,
} from '@/server/questions/constants';

function normalizeDayBoundary(value: Date, boundary: 'start' | 'end'): Date {
  const normalized = new Date(value);

  if (boundary === 'start') {
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
}

const optionalString = z.string().trim().optional().nullable();
const optionalStringArray = z.array(z.string().trim().min(1)).optional().default([]);
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);
const optionalPositiveBigInt = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.coerce.bigint().positive().optional()
);
const optionalBooleanLike = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (value === 'true' || value === '1' || value === true) {
    return true;
  }

  if (value === 'false' || value === '0' || value === false) {
    return false;
  }

  return value;
}, z.boolean().optional());
const optionalEnumLikeString = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.enum(values).optional().nullable()
  );
const createOptionalDateLike = (boundary: 'start' | 'end') =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.date().transform((value) => normalizeDayBoundary(value, boundary)).optional()
  );
const QUESTION_EXPORT_COLUMNS = ['id', 'question_uuid', 'category', 'sub_category', 'as_first'] as const;

export const questionUpsertSchema = z.object({
  question: z.string().trim().min(1, 'question is required'),
  cdnImagePrefix: optionalString,
  questionImage: optionalString,
  correctAnswer: z.string().trim().min(1, 'correctAnswer is required'),
  correctAnswerIndex: z.coerce.number().int().optional().default(0),
  incorrectAnswers: z.array(z.string().trim().min(1)).default([]),
  explanation: z.string().trim().min(1, 'explanation is required'),
  difficulty: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.enum(QUESTION_DIFFICULTIES).optional().default(QUESTION_DEFAULT_DIFFICULTY)
  ),
  category: z.enum(QUESTION_CATEGORIES),
  subCategory: optionalEnumLikeString(QUESTION_SUB_CATEGORIES),
  asFirst: z.boolean().optional().default(false),
  tags: optionalStringArray,
  keywords: optionalStringArray,
});

const questionListQuerySchemaBase = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  id: optionalPositiveBigInt,
  uuid: optionalTrimmedString,
  question: optionalTrimmedString,
  correctAnswer: optionalTrimmedString,
  asFirst: optionalBooleanLike,
  unused: optionalBooleanLike,
  category: z.enum(QUESTION_CATEGORIES).optional(),
  subCategory: z.enum(QUESTION_SUB_CATEGORIES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  createdAtFrom: createOptionalDateLike('start'),
  createdAtTo: createOptionalDateLike('end'),
});

export const questionListQuerySchema = questionListQuerySchemaBase.superRefine((value, ctx) => {
  if (value.createdAtFrom && value.createdAtTo && value.createdAtFrom > value.createdAtTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'createdAtFrom must be less than or equal to createdAtTo',
      path: ['createdAtFrom'],
    });
  }
});

export const questionExportQuerySchema = questionListQuerySchemaBase.omit({
  page: true,
  pageSize: true,
}).extend({
  columns: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.enum(QUESTION_EXPORT_COLUMNS)).min(1))
    .optional()
    .default(['id', 'question_uuid', 'category', 'sub_category', 'as_first']),
}).superRefine((value, ctx) => {
  if (value.createdAtFrom && value.createdAtTo && value.createdAtFrom > value.createdAtTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'createdAtFrom must be less than or equal to createdAtTo',
      path: ['createdAtFrom'],
    });
  }
});

export const questionIdParamSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const questionImportBodySchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).default([]),
});
