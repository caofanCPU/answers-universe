export type QuestionViewModel = {
  id: string;
  question: string;
  cdnImagePrefix?: string | null;
  questionImage?: string | null;
  questionImageUrl?: string | null;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string | null;
  tags: string[];
  asFirst: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type QuestionFormValues = {
  question: string;
  cdnImagePrefix: string;
  questionImage: string;
  correctAnswer: string;
  incorrectAnswersText: string;
  explanation: string;
  difficulty: string;
  category: string;
  subCategory: string;
  tags: string[];
  asFirst: boolean;
};
