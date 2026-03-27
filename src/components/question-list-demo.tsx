'use client';

import { useState } from 'react';
import { QuestionList } from './question-list';
import { QuestionListFilters } from './question-list-filters';
import { questionMockList } from './question-mock-data';
import type { QuestionListItemDto } from '@/server/questions/types';

type QuestionListDemoProps = {
  locale: string;
};

export function QuestionListDemo({ locale }: QuestionListDemoProps) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState('');

  const normalizedTags = tags
    .split(/[,，|]+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const items: QuestionListItemDto[] = questionMockList.filter((item) => {
    const matchKeyword = keyword.trim()
      ? item.question.toLowerCase().includes(keyword.trim().toLowerCase())
      : true;
    const matchCategory = category.trim()
      ? item.category.toLowerCase().includes(category.trim().toLowerCase())
      : true;
    const matchDifficulty = difficulty.trim()
      ? item.difficulty.toLowerCase().includes(difficulty.trim().toLowerCase())
      : true;
    const matchTags =
      normalizedTags.length > 0
        ? normalizedTags.every((tag) => item.tags.some((itemTag) => itemTag.toLowerCase().includes(tag)))
        : true;

    return matchKeyword && matchCategory && matchDifficulty && matchTags;
  }).map((item) => ({
    id: item.id,
    question: item.question,
    category: item.category,
    subCategory: item.subCategory,
    difficulty: item.difficulty,
    tags: item.tags,
    isFirst: item.isFirst,
    updatedAt: item.updatedAt ?? null,
  }));

  return (
    <div className="space-y-6">
      <QuestionListFilters
        locale={locale}
        keyword={keyword}
        category={category}
        difficulty={difficulty}
        tags={tags}
        onKeywordChange={setKeyword}
        onCategoryChange={setCategory}
        onDifficultyChange={setDifficulty}
        onTagsChange={setTags}
      />
      <QuestionList locale={locale} items={items} />
    </div>
  );
}
