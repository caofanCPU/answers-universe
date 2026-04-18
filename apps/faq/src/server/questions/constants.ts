export const QUESTION_DEFAULT_DIFFICULTY = 'unknown' as const;

export const QUESTION_DIFFICULTIES = [QUESTION_DEFAULT_DIFFICULTY, 'easy', 'medium', 'hard'] as const;

export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const QUESTION_CATEGORIES = [
  'Science & Nature',
  'Tech & Innovation',
  'Pop Culture',
  'Lifestyle & Fun',
  'Geography',
  'History',
  'Sports',
  'Music',
  'Sociology',
  'Art & Culture',
  'General Knowledge',
  'Food & Drink',
  'Psychology',
  'Linguistics',
  'Environment & Climate',
  'Business & Economics',
  'Architecture',
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const QUESTION_SUB_CATEGORIES = [
  'animal',
  'movie',
  'science',
  'car',
  'soccer',
  'chemistry',
] as const;

export type QuestionSubCategory = (typeof QUESTION_SUB_CATEGORIES)[number];
