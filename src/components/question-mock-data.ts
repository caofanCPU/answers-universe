import type { QuestionFormValues, QuestionViewModel } from './question-ui-types';

export const questionMockList: QuestionViewModel[] = [
  {
    id: '101',
    question: 'Which USB connector is reversible and commonly used by modern laptops and phones?',
    correctAnswer: 'USB-C',
    incorrectAnswers: ['USB-A', 'Mini USB', 'Micro USB'],
    explanation: 'USB-C is reversible and has become the default connector for many modern devices.',
    difficulty: 'Easy',
    category: 'Hardware',
    subCategory: 'USB Basics',
    tags: ['usb', 'connector', 'hardware'],
    isFirst: true,
    updatedAt: '2026-03-27T10:00:00.000Z',
    createdAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: '102',
    question: 'Which USB standard introduced 10 Gbps transfer speeds under the USB 3 family?',
    correctAnswer: 'USB 3.1 Gen 2',
    incorrectAnswers: ['USB 2.0', 'USB 3.0', 'USB 1.1'],
    explanation: 'USB 3.1 Gen 2 increased the theoretical transfer rate to 10 Gbps.',
    difficulty: 'Medium',
    category: 'Hardware',
    subCategory: 'USB Standards',
    tags: ['speed', 'usb-3', 'transfer'],
    isFirst: false,
    updatedAt: '2026-03-26T09:30:00.000Z',
    createdAt: '2026-03-18T09:30:00.000Z',
  },
  {
    id: '103',
    question: 'Which USB class is commonly used for keyboards and mice without custom drivers?',
    correctAnswer: 'HID',
    incorrectAnswers: ['MSC', 'UVC', 'CDC'],
    explanation: 'Human Interface Device (HID) is the standard class for keyboards, mice and similar devices.',
    difficulty: 'Medium',
    category: 'Protocol',
    subCategory: 'Device Classes',
    tags: ['hid', 'keyboard', 'mouse'],
    isFirst: false,
    updatedAt: '2026-03-25T14:15:00.000Z',
    createdAt: '2026-03-17T14:15:00.000Z',
  },
];

export const questionMockDetail = questionMockList[0];

export const questionMockFormValues: QuestionFormValues = {
  question: questionMockDetail.question,
  cdnImagePrefix: '',
  questionImage: '',
  correctAnswer: questionMockDetail.correctAnswer,
  incorrectAnswersText: questionMockDetail.incorrectAnswers.join('\n'),
  explanation: questionMockDetail.explanation,
  difficulty: questionMockDetail.difficulty,
  category: questionMockDetail.category,
  subCategory: questionMockDetail.subCategory,
  tagsText: questionMockDetail.tags.join(', '),
  isFirst: questionMockDetail.isFirst,
};
