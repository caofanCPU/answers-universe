import type { OuterPagination, OuterQuestionCategory, OuterQuestionDifficulty, OuterQuestionSubCategory } from './shared.js';
export type OuterQuestionBaseQuery = {
    page?: number;
    pageSize?: number;
    ids?: string[];
    uuids?: string[];
    asFirst?: boolean;
    category?: OuterQuestionCategory;
    subCategory?: OuterQuestionSubCategory;
    difficulty?: OuterQuestionDifficulty;
    createdAtFrom?: string;
    createdAtTo?: string;
    updatedAtFrom?: string;
    updatedAtTo?: string;
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
    pagination: OuterPagination;
};
