import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);

export const outerClientCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  remark: optionalString.nullable(),
  expiresIn: z.enum(['3_months', '6_months', '1_year', 'never']),
});

export const outerClientIdParamSchema = z.object({
  clientId: z.string().trim().min(3).max(100),
});

export const outerClientKeyIssueSchema = z.object({
  expiresIn: z.enum(['3_months', '6_months', '1_year', 'never']),
});

export const outerClientKeyParamSchema = z.object({
  clientId: z.string().trim().min(3).max(100),
  keyVersion: z.string().trim().min(1).max(100),
});

export const outerClientKeyExtendSchema = z.object({
  extendBy: z.enum(['3_months', '6_months', '1_year', 'never']),
});
