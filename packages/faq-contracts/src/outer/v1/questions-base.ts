import type { OuterQuestionDetailDto } from './question-detail.js';

export type OuterQuestionBaseQuery = {
  ids?: string[];
};

export type OuterQuestionBaseItemDto = OuterQuestionDetailDto;

export type OuterQuestionBaseResult = {
  items: OuterQuestionBaseItemDto[];
};
