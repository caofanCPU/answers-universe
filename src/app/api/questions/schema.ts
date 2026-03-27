import { z } from 'zod';

const optionalString = z.string().trim().optional().nullable();

export const questionUpsertSchema = z.object({
  question: z.string().trim().min(1, 'question is required'),
  cdnImagePrefix: optionalString,
  questionImage: optionalString,
  correctAnswer: z.string().trim().min(1, 'correctAnswer is required'),
  incorrectAnswers: z.array(z.string().trim().min(1)).default([]),
  explanation: z.string().trim().min(1, 'explanation is required'),
  difficulty: z.string().trim().min(1, 'difficulty is required'),
  category: z.string().trim().min(1, 'category is required'),
  subCategory: z.string().trim().min(1, 'subCategory is required'),
  isFirst: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
});

export const questionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  keyword: z.string().trim().optional(),
  category: z.string().trim().optional(),
  difficulty: z.string().trim().optional(),
  tags: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return [];
      }

      return value
        .split(/[,，|]+/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    }),
});

export const questionIdParamSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const questionImportBodySchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).default([]),
});
