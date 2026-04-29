export type RandomQuestionPlannerRecord = {
  id: bigint;
  asFirst: number;
  category: string;
};

export type RandomQuestionPlannerSet<T extends RandomQuestionPlannerRecord> = {
  firstQuestion: T;
  normalQuestions: T[];
};

function createStableNumberSeed(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function orderRecordsForStableSelection<T extends { id: bigint }>(records: T[], seedSource: string): T[] {
  return [...records].sort((left, right) => {
    const leftSeed = createStableNumberSeed(`${seedSource}-${left.id.toString()}`);
    const rightSeed = createStableNumberSeed(`${seedSource}-${right.id.toString()}`);

    if (leftSeed !== rightSeed) {
      return leftSeed - rightSeed;
    }

    return left.id < right.id ? -1 : 1;
  });
}

function groupRecordsByCategory<T extends RandomQuestionPlannerRecord>(records: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const existing = grouped.get(record.category) ?? [];
    existing.push(record);
    grouped.set(record.category, existing);
  }

  return grouped;
}

function selectNormalQuestionsForFirstCategory<T extends RandomQuestionPlannerRecord>({
  groupedNormalQuestions,
  showDate,
  firstCategory,
  targetNormalCount,
}: {
  groupedNormalQuestions: Map<string, T[]>;
  showDate: string;
  firstCategory: string;
  targetNormalCount: number;
}): T[] {
  const categoryEntries = [...groupedNormalQuestions.entries()]
    .filter(([category]) => category !== firstCategory)
    .sort(([leftCategory, leftRecords], [rightCategory, rightRecords]) => {
      if (leftRecords.length !== rightRecords.length) {
        return rightRecords.length - leftRecords.length;
      }

      const leftSeed = createStableNumberSeed(`${showDate}-category-${leftCategory}`);
      const rightSeed = createStableNumberSeed(`${showDate}-category-${rightCategory}`);

      if (leftSeed !== rightSeed) {
        return leftSeed - rightSeed;
      }

      return leftCategory.localeCompare(rightCategory);
    });

  return categoryEntries
    .slice(0, targetNormalCount)
    .map(([, categoryRecords]) => orderRecordsForStableSelection(categoryRecords, `normal-${showDate}`)[0])
    .filter((record): record is T => Boolean(record));
}

function scoreFirstQuestionCandidate<T extends RandomQuestionPlannerRecord>({
  firstQuestion,
  firstQuestionCountByCategory,
  normalQuestionCountByCategory,
  normalCategoryCountAfterExcludingFirst,
  showDate,
}: {
  firstQuestion: T;
  firstQuestionCountByCategory: Map<string, number>;
  normalQuestionCountByCategory: Map<string, number>;
  normalCategoryCountAfterExcludingFirst: number;
  showDate: string;
}): number {
  const firstCategory = firstQuestion.category;
  const firstCount = firstQuestionCountByCategory.get(firstCategory) ?? 0;
  const normalCount = normalQuestionCountByCategory.get(firstCategory) ?? 0;
  const stableTieBreaker = createStableNumberSeed(`first-${showDate}-${firstQuestion.id.toString()}`) / 0xffffffff;

  return normalCategoryCountAfterExcludingFirst * 1000 + firstCount * 10 - normalCount + stableTieBreaker;
}

export function selectBestRandomQuestionSet<T extends RandomQuestionPlannerRecord>({
  firstQuestions,
  normalQuestions,
  showDate,
  targetTotal,
}: {
  firstQuestions: T[];
  normalQuestions: T[];
  showDate: string;
  targetTotal: number;
}): RandomQuestionPlannerSet<T> | null {
  const targetNormalCount = Math.max(targetTotal - 1, 0);

  if (firstQuestions.length === 0) {
    return null;
  }

  const groupedFirstQuestions = groupRecordsByCategory(firstQuestions);
  const groupedNormalQuestions = groupRecordsByCategory(normalQuestions);
  const firstQuestionCountByCategory = new Map(
    [...groupedFirstQuestions.entries()].map(([category, records]) => [category, records.length])
  );
  const normalQuestionCountByCategory = new Map(
    [...groupedNormalQuestions.entries()].map(([category, records]) => [category, records.length])
  );
  const scoredCandidates = firstQuestions
    .map((firstQuestion) => {
      const normalCategoryCountAfterExcludingFirst = [...groupedNormalQuestions.keys()].filter(
        (category) => category !== firstQuestion.category
      ).length;
      const candidateNormalQuestions = selectNormalQuestionsForFirstCategory({
        groupedNormalQuestions,
        showDate,
        firstCategory: firstQuestion.category,
        targetNormalCount,
      });

      return {
        firstQuestion,
        normalQuestions: candidateNormalQuestions,
        canFillTarget: candidateNormalQuestions.length >= targetNormalCount,
        score: scoreFirstQuestionCandidate({
          firstQuestion,
          firstQuestionCountByCategory,
          normalQuestionCountByCategory,
          normalCategoryCountAfterExcludingFirst,
          showDate,
        }),
      };
    })
    .sort((left, right) => {
      if (left.canFillTarget !== right.canFillTarget) {
        return left.canFillTarget ? -1 : 1;
      }

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      const leftSeed = createStableNumberSeed(`first-${showDate}-${left.firstQuestion.id.toString()}`);
      const rightSeed = createStableNumberSeed(`first-${showDate}-${right.firstQuestion.id.toString()}`);

      if (leftSeed !== rightSeed) {
        return leftSeed - rightSeed;
      }

      return left.firstQuestion.id < right.firstQuestion.id ? -1 : 1;
    });

  const bestCandidate = scoredCandidates[0];

  if (!bestCandidate) {
    return null;
  }

  return {
    firstQuestion: bestCandidate.firstQuestion,
    normalQuestions: bestCandidate.normalQuestions,
  };
}
