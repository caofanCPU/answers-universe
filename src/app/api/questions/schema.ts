import { z } from 'zod';
import { QUESTION_CATEGORIES, QUESTION_DIFFICULTIES, QUESTION_SUB_CATEGORIES } from '@/server/questions/constants';

const optionalString = z.string().trim().optional().nullable();
const optionalStringArray = z.array(z.string().trim().min(1)).optional().default([]);
const optionalEnumLikeString = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.enum(values).optional().nullable()
  );

export const questionUpsertSchema = z.object({
  question: z.string().trim().min(1, 'question is required'),
  cdnImagePrefix: optionalString,
  questionImage: optionalString,
  correctAnswer: z.string().trim().min(1, 'correctAnswer is required'),
  correctAnswerIndex: z.coerce.number().int().optional().default(0),
  incorrectAnswers: z.array(z.string().trim().min(1)).default([]),
  explanation: z.string().trim().min(1, 'explanation is required'),
  difficulty: z.enum(QUESTION_DIFFICULTIES),
  category: z.enum(QUESTION_CATEGORIES),
  subCategory: optionalEnumLikeString(QUESTION_SUB_CATEGORIES),
  isFirst: z.boolean().optional().default(false),
  tags: optionalStringArray,
  keywords: optionalStringArray,
});

export const questionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(QUESTION_CATEGORIES).optional(),
  subCategory: z.enum(QUESTION_SUB_CATEGORIES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
});

export const questionIdParamSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const questionImportBodySchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).default([]),
});
