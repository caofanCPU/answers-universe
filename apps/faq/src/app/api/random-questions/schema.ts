import { z } from 'zod';

const showDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'showDate must be in YYYY-MM-DD format');

export const randomQuestionShowDateQuerySchema = z.object({
  showDate: showDateSchema,
});

export const randomQuestionPreviewBodySchema = z.object({
  snapshotVersion: z.string().trim().min(1).optional(),
  showDate: showDateSchema,
});

export const randomQuestionPlanRangeBodySchema = z.object({
  snapshotVersion: z.string().trim().min(1).optional(),
  startDate: showDateSchema,
  endDate: showDateSchema,
});

export const randomQuestionCommitBodySchema = z.object({
  snapshotVersion: z.string().trim().min(1).optional(),
  groupId: z.string().trim().min(1).optional(),
  showDate: showDateSchema,
  replaceExisting: z.boolean().optional().default(false),
  items: z.array(
    z.object({
      questionId: z.string().trim().min(1),
      questionUuid: z.string().trim().uuid(),
      asFirst: z.number().int().min(0).max(1),
      category: z.string().trim().min(1),
      sortOrder: z.number().int().min(1),
    })
  ),
});

export const randomQuestionBulkCommitBodySchema = z.object({
  plans: z.array(
    z.object({
      snapshotVersion: z.string().trim().min(1).optional(),
      groupId: z.string().trim().min(1).optional(),
      showDate: showDateSchema,
      items: randomQuestionCommitBodySchema.shape.items,
    })
  ).min(1),
});

export const randomQuestionRegenerateBodySchema = z.object({
  showDate: showDateSchema,
});
