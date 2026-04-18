import { getTranslations } from 'next-intl/server';

export type QuestionFormCopy = {
  question: string;
  answersLabel: string;
  answersPlaceholder: string;
  answersEmpty: string;
  answersExpand: string;
  answersCollapse: string;
  answersCorrectPrefix: string;
  answersNoCorrect: string;
  categoryLabel: string;
  categoryEmpty: string;
  subCategoryLabel: string;
  subCategoryEmpty: string;
  difficultyLabel: string;
  difficultyEmpty: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  tagsEmpty: string;
  explanation: string;
  cdnImagePrefix: string;
  questionImage: string;
  asFirst: string;
};

export type QuestionEditorCopy = {
  noticeCreate: string;
  noticeEdit: string;
  loading: string;
  submitFailed: string;
  saving: string;
  saved: string;
  createButton: string;
  updateButton: string;
  form: QuestionFormCopy;
  detail: QuestionPreviewCopy;
  preview: {
    toggleAriaLabel: string;
    edit: string;
    preview: string;
    draftHint: string;
    reviewButton: string;
    previous: string;
    next: string;
    progress: string;
    showFullPreview: string;
    switchToPlayerView: string;
  };
};

export type QuestionImportCopy = {
  toolbar: {
    uploadJson: string;
    loadSample: string;
    validateAll: string;
    validating: string;
    import: string;
    importing: string;
  };
  errors: {
    jsonOnly: string;
    dialogTitle: string;
    closeAriaLabel: string;
  };
  result: {
    title: string;
    total: string;
    success: string;
    dialogTitle: string;
    dialogDescription: string;
  };
  workbench: {
    title: string;
    itemProgress: string;
    removeCurrent: string;
    validateCurrent: string;
    validating: string;
  };
  form: QuestionFormCopy;
};

export type QuestionListItemCopy = {
  empty: string;
  copyId: string;
  copyUuid: string;
  firstBadge: string;
  deleteLoading: string;
  delete: string;
  view: string;
  edit: string;
  confirmDeleteTitle: string;
  confirmDeleteDescription: string;
  cancel: string;
  confirmDelete: string;
};

export type QuestionPreviewCopy = {
  firstBadge: string;
  previewDescription: string;
  options: string;
  explanation: string;
  tags: string;
};

export type QuestionsListPageCopy = {
  title: string;
  description: string;
  actions: {
    create: string;
    import: string;
    randomSets: string;
    clients: string;
  };
  client: {
    filters: {
      categoryLabel: string;
      categoryAll: string;
      subCategoryLabel: string;
      subCategoryAll: string;
      difficultyLabel: string;
      difficultyAll: string;
      questionLabel: string;
      questionPlaceholder: string;
      correctAnswerLabel: string;
      correctAnswerPlaceholder: string;
      createdAtFromLabel: string;
      createdAtToLabel: string;
      advancedToggle: string;
      idLabel: string;
      idPlaceholder: string;
      uuidLabel: string;
      uuidPlaceholder: string;
      firstLabel: string;
    };
    loading: string;
    loadFailed: string;
    pagination: {
      summary: string;
      previous: string;
      next: string;
      enterPage: string;
      enterPageHint: string;
      jumpToLast: string;
      total: string;
    };
    export: {
      settingsLabel: string;
      buttonLabel: string;
      loadingLabel: string;
      dialogTitle: string;
      dialogDescription: string;
      settingsAriaLabel: string;
      closeAriaLabel: string;
      confirm: string;
      cancel: string;
      requiredHint: string;
      failed: string;
      columns: {
        id: string;
        questionUuid: string;
        category: string;
        subCategory: string;
        asFirst: string;
      };
    };
    item: QuestionListItemCopy;
  };
};

export type QuestionEditorPageCopy = {
  title: string;
  description: string;
  actions: {
    primary: string;
    secondary?: string;
  };
  backLabel: string;
  editor: QuestionEditorCopy;
};

export type QuestionImportPageCopy = {
  title: string;
  description: string;
  actions: {
    backToList: string;
    create: string;
  };
  client: QuestionImportCopy;
};

export type RandomQuestionsPageCopy = {
  title: string;
  description: string;
  actions: {
    backToList: string;
    create: string;
    import: string;
  };
};
export async function getQuestionFormCopy(locale: string): Promise<QuestionFormCopy> {
  const formT = await getTranslations({ locale, namespace: 'faqPage.questionForm' });

  return {
    question: formT('question'),
    answersLabel: formT('answers.label'),
    answersPlaceholder: formT('answers.placeholder'),
    answersEmpty: formT('answers.empty'),
    answersExpand: formT('answers.expand'),
    answersCollapse: formT('answers.collapse'),
    answersCorrectPrefix: formT('answers.correctPrefix'),
    answersNoCorrect: formT('answers.noCorrect'),
    categoryLabel: formT('category.label'),
    categoryEmpty: formT('category.empty'),
    subCategoryLabel: formT('subCategory.label'),
    subCategoryEmpty: formT('subCategory.empty'),
    difficultyLabel: formT('difficulty.label'),
    difficultyEmpty: formT('difficulty.empty'),
    tagsLabel: formT('tags.label'),
    tagsPlaceholder: formT('tags.placeholder'),
    tagsEmpty: formT('tags.empty'),
    explanation: formT('explanation'),
    cdnImagePrefix: formT('cdnImagePrefix'),
    questionImage: formT('questionImage'),
    asFirst: formT('asFirst'),
  };
}

export async function getQuestionPreviewCopy(locale: string): Promise<QuestionPreviewCopy> {
  const previewT = await getTranslations({ locale, namespace: 'faqPage.questionPreview' });

  return {
    firstBadge: previewT('firstBadge'),
    previewDescription: previewT('previewDescription'),
    options: previewT('options'),
    explanation: previewT('explanation'),
    tags: previewT('tags'),
  };
}

export async function getQuestionsListPageCopy(locale: string): Promise<QuestionsListPageCopy> {
  const listT = await getTranslations({ locale, namespace: 'faqPage.questionsList' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

  return {
    title: listT('title'),
    description: listT('description'),
    actions: {
      create: listT('actions.create'),
      import: importT('title'),
      randomSets: 'Random Sets',
      clients: 'Clients',
    },
    client: {
      filters: {
        categoryLabel: listT('filters.category.label'),
        categoryAll: listT('filters.category.all'),
        subCategoryLabel: listT('filters.subCategory.label'),
        subCategoryAll: listT('filters.subCategory.all'),
        difficultyLabel: listT('filters.difficulty.label'),
        difficultyAll: listT('filters.difficulty.all'),
        questionLabel: listT('filters.question.label'),
        questionPlaceholder: listT('filters.question.placeholder'),
        correctAnswerLabel: listT('filters.correctAnswer.label'),
        correctAnswerPlaceholder: listT('filters.correctAnswer.placeholder'),
        createdAtFromLabel: listT('filters.createdAt.fromLabel'),
        createdAtToLabel: listT('filters.createdAt.toLabel'),
        advancedToggle: listT('filters.advancedToggle'),
        idLabel: listT('filters.id.label'),
        idPlaceholder: listT('filters.id.placeholder'),
        uuidLabel: listT('filters.uuid.label'),
        uuidPlaceholder: listT('filters.uuid.placeholder'),
        firstLabel: listT('filters.first.label'),
      },
      loading: listT('status.loading'),
      loadFailed: listT('status.loadFailed'),
      pagination: {
        summary: listT.raw('pagination.summary'),
        previous: listT('pagination.previous'),
        next: listT('pagination.next'),
        enterPage: listT('pagination.enterPage'),
        enterPageHint: listT('pagination.enterPageHint'),
        jumpToLast: listT('pagination.jumpToLast'),
        total: listT.raw('pagination.total'),
      },
      export: {
        settingsLabel: listT('export.settings'),
        buttonLabel: listT('export.button'),
        loadingLabel: listT('export.loading'),
        dialogTitle: listT('export.dialog.title'),
        dialogDescription: listT('export.dialog.description'),
        settingsAriaLabel: listT('export.dialog.settingsAriaLabel'),
        closeAriaLabel: listT('export.dialog.closeAriaLabel'),
        confirm: listT('export.dialog.confirm'),
        cancel: listT('export.dialog.cancel'),
        requiredHint: listT('export.dialog.requiredHint'),
        failed: listT('export.status.failed'),
        columns: {
          id: listT('export.columns.id'),
          questionUuid: listT('export.columns.questionUuid'),
          category: listT('export.columns.category'),
          subCategory: listT('export.columns.subCategory'),
          asFirst: listT('export.columns.asFirst'),
        },
      },
      item: {
        empty: listT('item.empty'),
        copyId: listT('item.copyId'),
        copyUuid: listT('item.copyUuid'),
        firstBadge: listT('item.firstBadge'),
        deleteLoading: listT('item.deleteLoading'),
        delete: listT('item.delete'),
        view: listT('item.view'),
        edit: listT('item.edit'),
        confirmDeleteTitle: listT('item.confirmDeleteTitle'),
        confirmDeleteDescription: listT('item.confirmDeleteDescription'),
        cancel: listT('item.cancel'),
        confirmDelete: listT('item.confirmDelete'),
      },
    },
  };
}

export async function getQuestionCreatePageCopy(locale: string): Promise<QuestionEditorPageCopy> {
  const createT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const [formCopy, previewCopy] = await Promise.all([
    getQuestionFormCopy(locale),
    getQuestionPreviewCopy(locale),
  ]);

  return {
    title: createT('title'),
    description: createT('description'),
    actions: {
      primary: importT('title'),
    },
    backLabel: createT('actions.backToList'),
    editor: {
      noticeCreate: createT('notice'),
      noticeEdit: createT('notice'),
      loading: createT('status.loading'),
      submitFailed: createT('status.submitFailed'),
      saving: createT('status.saving'),
      saved: createT('status.saved'),
      createButton: createT('actions.submit'),
      updateButton: createT('actions.submit'),
      form: formCopy,
      detail: previewCopy,
      preview: {
        toggleAriaLabel: createT('preview.toggleAriaLabel'),
        edit: createT('preview.edit'),
        preview: createT('preview.preview'),
        draftHint: createT('preview.draftHint'),
        reviewButton: createT('preview.reviewButton'),
        previous: createT('preview.previous'),
        next: createT('preview.next'),
        progress: createT('preview.progress'),
        showFullPreview: createT('preview.showFullPreview'),
        switchToPlayerView: createT('preview.switchToPlayerView'),
      },
    },
  };
}

export async function getQuestionDetailPageCopy(locale: string, id: string): Promise<QuestionEditorPageCopy> {
  const detailT = await getTranslations({ locale, namespace: 'faqPage.questionDetail' });
  const createT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const editT = await getTranslations({ locale, namespace: 'faqPage.questionEdit' });
  const [formCopy, previewCopy] = await Promise.all([
    getQuestionFormCopy(locale),
    getQuestionPreviewCopy(locale),
  ]);

  return {
    title: detailT('title', { id }),
    description: detailT('description'),
    actions: {
      primary: importT('title'),
      secondary: createT('title'),
    },
    backLabel: detailT('actions.backToList'),
    editor: {
      noticeCreate: editT('notice'),
      noticeEdit: editT('notice'),
      loading: editT('status.loading'),
      submitFailed: editT('status.submitFailed'),
      saving: editT('status.saving'),
      saved: editT('status.saved'),
      createButton: editT('actions.submit'),
      updateButton: editT('actions.submit'),
      form: formCopy,
      detail: previewCopy,
      preview: {
        toggleAriaLabel: editT('preview.toggleAriaLabel'),
        edit: editT('preview.edit'),
        preview: editT('preview.preview'),
        draftHint: editT('preview.draftHint'),
        reviewButton: editT('preview.reviewButton'),
        previous: editT('preview.previous'),
        next: editT('preview.next'),
        progress: editT('preview.progress'),
        showFullPreview: editT('preview.showFullPreview'),
        switchToPlayerView: editT('preview.switchToPlayerView'),
      },
    },
  };
}

export async function getQuestionEditPageCopy(locale: string, id: string): Promise<QuestionEditorPageCopy> {
  const editT = await getTranslations({ locale, namespace: 'faqPage.questionEdit' });
  const createT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const [formCopy, previewCopy] = await Promise.all([
    getQuestionFormCopy(locale),
    getQuestionPreviewCopy(locale),
  ]);

  return {
    title: editT('title', { id }),
    description: editT('description'),
    actions: {
      primary: importT('title'),
      secondary: createT('title'),
    },
    backLabel: createT('actions.backToList'),
    editor: {
      noticeCreate: editT('notice'),
      noticeEdit: editT('notice'),
      loading: editT('status.loading'),
      submitFailed: editT('status.submitFailed'),
      saving: editT('status.saving'),
      saved: editT('status.saved'),
      createButton: editT('actions.submit'),
      updateButton: editT('actions.submit'),
      form: formCopy,
      detail: previewCopy,
      preview: {
        toggleAriaLabel: editT('preview.toggleAriaLabel'),
        edit: editT('preview.edit'),
        preview: editT('preview.preview'),
        draftHint: editT('preview.draftHint'),
        reviewButton: editT('preview.reviewButton'),
        previous: editT('preview.previous'),
        next: editT('preview.next'),
        progress: editT('preview.progress'),
        showFullPreview: editT('preview.showFullPreview'),
        switchToPlayerView: editT('preview.switchToPlayerView'),
      },
    },
  };
}

export async function getQuestionImportPageCopy(locale: string): Promise<QuestionImportPageCopy> {
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });
  const createT = await getTranslations({ locale, namespace: 'faqPage.questionCreate' });
  const formCopy = await getQuestionFormCopy(locale);

  return {
    title: importT('title'),
    description: importT('description'),
    actions: {
      backToList: importT('actions.backToList'),
      create: createT('title'),
    },
    client: {
      toolbar: {
        uploadJson: importT('toolbar.uploadJson'),
        loadSample: importT('toolbar.loadSample'),
        validateAll: importT('toolbar.validateAll'),
        validating: importT('toolbar.validating'),
        import: importT('toolbar.import'),
        importing: importT('toolbar.importing'),
      },
      errors: {
        jsonOnly: importT('errors.jsonOnly'),
        dialogTitle: importT('errors.dialogTitle'),
        closeAriaLabel: importT('errors.closeAriaLabel'),
      },
      result: {
        title: importT('result.title'),
        total: importT.raw('result.total'),
        success: importT.raw('result.success'),
        dialogTitle: importT('result.dialogTitle'),
        dialogDescription: importT('result.dialogDescription'),
      },
      workbench: {
        title: importT('workbench.title'),
        itemProgress: importT.raw('workbench.itemProgress'),
        removeCurrent: importT('workbench.removeCurrent'),
        validateCurrent: importT('workbench.validateCurrent'),
        validating: importT('workbench.validating'),
      },
      form: formCopy,
    },
  };
}

export async function getRandomQuestionsPageCopy(locale: string): Promise<RandomQuestionsPageCopy> {
  const listT = await getTranslations({ locale, namespace: 'faqPage.questionsList' });
  const importT = await getTranslations({ locale, namespace: 'faqPage.questionsImport' });

  return {
    title: 'Random Question Sets',
    description: 'Generate daily random question sets, inspect saved dates, and regenerate a day when the pool changes.',
    actions: {
      backToList: 'Back to List',
      create: listT('actions.create'),
      import: importT('title'),
    },
  };
}
