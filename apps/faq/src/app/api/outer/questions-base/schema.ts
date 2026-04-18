import { z } from 'zod';

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

export const outerQuestionBaseQuerySchema = z.object({
  ids: optionalBigIntList,
});
