import { z } from 'zod';
import { QUESTION_CATEGORIES, QUESTION_DIFFICULTIES, QUESTION_SUB_CATEGORIES } from '@/server/questions/constants';

function normalizeDayBoundary(value: Date, boundary: 'start' | 'end'): Date {
  const normalized = new Date(value);

  if (boundary === 'start') {
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
}

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

const createOptionalDateLike = (boundary: 'start' | 'end') =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return value;
  }, z.coerce.date().transform((value) => normalizeDayBoundary(value, boundary)).optional());

const optionalBigIntList = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.coerce.bigint().positive()).optional());

const optionalStringList = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string().trim().min(1)).optional());

export const outerQuestionBaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  ids: optionalBigIntList,
  uuids: optionalStringList,
  asFirst: optionalBooleanLike,
  category: z.enum(QUESTION_CATEGORIES).optional(),
  subCategory: z.enum(QUESTION_SUB_CATEGORIES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  createdAtFrom: createOptionalDateLike('start'),
  createdAtTo: createOptionalDateLike('end'),
  updatedAtFrom: createOptionalDateLike('start'),
  updatedAtTo: createOptionalDateLike('end'),
}).superRefine((value, ctx) => {
  if (value.createdAtFrom && value.createdAtTo && value.createdAtFrom > value.createdAtTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'createdAtFrom must be less than or equal to createdAtTo',
      path: ['createdAtFrom'],
    });
  }

  if (value.updatedAtFrom && value.updatedAtTo && value.updatedAtFrom > value.updatedAtTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'updatedAtFrom must be less than or equal to updatedAtTo',
      path: ['updatedAtFrom'],
    });
  }
});
