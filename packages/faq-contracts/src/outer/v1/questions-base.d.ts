import type { OuterQuestionCategory, OuterQuestionDifficulty, OuterQuestionSubCategory } from './shared.js';
export type OuterQuestionBaseQuery = {
    ids?: string[];
};
export type OuterQuestionBaseItemDto = {
    id: string;
    uuid: string;
    question: string;
    category: OuterQuestionCategory;
    subCategory: OuterQuestionSubCategory | null;
    difficulty: OuterQuestionDifficulty;
    asFirst: boolean;
    createdAt: string | null;
    updatedAt: string | null;
};
export type OuterQuestionBaseResult = {
    items: OuterQuestionBaseItemDto[];
};
