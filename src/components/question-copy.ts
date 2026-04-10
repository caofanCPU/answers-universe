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
  };
  result: {
    title: string;
    total: string;
    success: string;
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
  showFullPreview: string;
  switchToPlayerView: string;
  openPreview: string;
};

export type QuestionDetailClientCopy = {
  loading: string;
  notFound: string;
  loadFailed: string;
};

type TranslateFn = (key: string, values?: Record<string, any>) => string;
type RawTranslateFn = (key: string) => string;

export function buildQuestionFormCopy(t: TranslateFn): QuestionFormCopy {
  return {
    question: t('question'),
    answersLabel: t('answers.label'),
    answersPlaceholder: t('answers.placeholder'),
    answersEmpty: t('answers.empty'),
    answersExpand: t('answers.expand'),
    answersCollapse: t('answers.collapse'),
    answersCorrectPrefix: t('answers.correctPrefix'),
    answersNoCorrect: t('answers.noCorrect'),
    categoryLabel: t('category.label'),
    categoryEmpty: t('category.empty'),
    subCategoryLabel: t('subCategory.label'),
    subCategoryEmpty: t('subCategory.empty'),
    difficultyLabel: t('difficulty.label'),
    difficultyEmpty: t('difficulty.empty'),
    tagsLabel: t('tags.label'),
    tagsPlaceholder: t('tags.placeholder'),
    tagsEmpty: t('tags.empty'),
    explanation: t('explanation'),
    cdnImagePrefix: t('cdnImagePrefix'),
    questionImage: t('questionImage'),
    asFirst: t('asFirst'),
  };
}

export function buildQuestionEditorCopy(
  t: TranslateFn,
  form: QuestionFormCopy,
  detail: QuestionPreviewCopy
): QuestionEditorCopy {
  return {
    noticeCreate: t('notice'),
    noticeEdit: t('notice'),
    loading: t('status.loading'),
    submitFailed: t('status.submitFailed'),
    saving: t('status.saving'),
    saved: t('status.saved'),
    createButton: t('actions.submit'),
    updateButton: t('actions.submit'),
    form,
    detail,
    preview: {
      toggleAriaLabel: t('preview.toggleAriaLabel'),
      edit: t('preview.edit'),
      preview: t('preview.preview'),
      draftHint: t('preview.draftHint'),
      reviewButton: t('preview.reviewButton'),
      previous: t('preview.previous'),
      next: t('preview.next'),
      progress: t('preview.progress'),
      showFullPreview: t('preview.showFullPreview'),
      switchToPlayerView: t('preview.switchToPlayerView'),
    },
  };
}

export function buildQuestionImportCopy(
  t: TranslateFn,
  raw: RawTranslateFn,
  form: QuestionFormCopy
): QuestionImportCopy {
  return {
    toolbar: {
      uploadJson: t('toolbar.uploadJson'),
      loadSample: t('toolbar.loadSample'),
      validateAll: t('toolbar.validateAll'),
      validating: t('toolbar.validating'),
      import: t('toolbar.import'),
      importing: t('toolbar.importing'),
    },
    errors: {
      jsonOnly: t('errors.jsonOnly'),
    },
    result: {
      title: t('result.title'),
      total: raw('result.total'),
      success: raw('result.success'),
    },
    workbench: {
      title: t('workbench.title'),
      itemProgress: raw('workbench.itemProgress'),
      removeCurrent: t('workbench.removeCurrent'),
      validateCurrent: t('workbench.validateCurrent'),
      validating: t('workbench.validating'),
    },
    form,
  };
}

export function buildQuestionListItemCopy(t: TranslateFn): QuestionListItemCopy {
  return {
    empty: t('item.empty'),
    copyId: t('item.copyId'),
    copyUuid: t('item.copyUuid'),
    firstBadge: t('item.firstBadge'),
    deleteLoading: t('item.deleteLoading'),
    delete: t('item.delete'),
    view: t('item.view'),
    edit: t('item.edit'),
    confirmDeleteTitle: t('item.confirmDeleteTitle'),
    confirmDeleteDescription: t('item.confirmDeleteDescription'),
    cancel: t('item.cancel'),
    confirmDelete: t('item.confirmDelete'),
  };
}

export function buildQuestionPreviewCopy(t: TranslateFn): QuestionPreviewCopy {
  return {
    firstBadge: t('firstBadge'),
    previewDescription: t('previewDescription'),
    options: t('options'),
    explanation: t('explanation'),
    tags: t('tags'),
    showFullPreview: t('showFullPreview'),
    switchToPlayerView: t('switchToPlayerView'),
    openPreview: t('openPreview'),
  };
}

export function buildQuestionDetailClientCopy(t: TranslateFn): QuestionDetailClientCopy {
  return {
    loading: t('status.loading'),
    notFound: t('status.notFound'),
    loadFailed: t('status.loadFailed'),
  };
}
