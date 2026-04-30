import { getTranslations } from 'next-intl/server';

type ExpiryOptions = Record<'3_months' | '6_months' | '1_year' | 'never', string>;

export type OuterClientsPageCopy = {
  title: string;
  description: string;
  actions: {
    backToQuestions: string;
  };
  client: {
    loading: string;
    loadFailed: string;
    empty: string;
    createTitle: string;
    createDescription: string;
    createOpen: string;
    createPanelTitle: string;
    createPanelDescription: string;
    createResultTitle: string;
    createResultDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    remarkLabel: string;
    remarkPlaceholder: string;
    expiresInLabel: string;
    expiresInEmpty: string;
    expiresInOptions: ExpiryOptions;
    createButton: string;
    creating: string;
    closePanel: string;
    cancel: string;
    confirm: string;
    deleteClientTitle: string;
    deleteClientDescription: string;
    deleteClientPendingTitle: string;
    deleteClientPendingDescription: string;
    detail: string;
    delete: string;
    deleting: string;
    undo: string;
    copied: string;
    copyEnvBlock: string;
    showSecret: string;
    hideSecret: string;
  };
};

export type OuterClientDetailPageCopy = {
  title: string;
  description: string;
  actions: {
    backToClients: string;
  };
  client: {
    loading: string;
    loadFailed: string;
    notFound: string;
    generateKeyTitle: string;
    generateKeyDescription: string;
    expiresInLabel: string;
    expiresInEmpty: string;
    expiresInOptions: ExpiryOptions;
    generateKey: string;
    generating: string;
    currentActiveKeyTitle: string;
    deActiveKeysTitle: string;
    generatedKeyTitle: string;
    generatedKeyDescription: string;
    unsavedLeaveTitle: string;
    unsavedLeaveDescription: string;
    deleteClientTitle: string;
    deleteClientDescription: string;
    deleteActiveKeyTitle: string;
    deleteActiveKeyDescription: string;
    deleteKeyTitle: string;
    deleteKeyDescription: string;
    deleteKeyPendingTitle: string;
    deleteKeyPendingDescription: string;
    cancel: string;
    confirm: string;
    undo: string;
    closeSecret: string;
    closeDialog: string;
    copyEnvBlock: string;
    copied: string;
    showSecret: string;
    hideSecret: string;
    noKeys: string;
    backToClients: string;
    privateKeyLabel: string;
    rotatingGraceHint: string;
    deleteKey: string;
    extendKey: string;
    extendByLabel: string;
    extending: string;
    deleting: string;
    keys: {
      keyVersion: string;
      algorithm: string;
      fingerprint: string;
      expiresAt: string;
      lastUsedAt: string;
      createdAt: string;
      publicKey: string;
    };
  };
};

export async function getOuterClientsPageCopy(locale: string): Promise<OuterClientsPageCopy> {
  const t = await getTranslations({ locale, namespace: 'clientPage.list' });

  return {
    title: t('title'),
    description: t('description'),
    actions: {
      backToQuestions: t('actions.backToQuestions'),
    },
    client: {
      loading: t('client.loading'),
      loadFailed: t('client.loadFailed'),
      empty: t('client.empty'),
      createTitle: t('client.createTitle'),
      createDescription: t('client.createDescription'),
      createOpen: t('client.createOpen'),
      createPanelTitle: t('client.createPanelTitle'),
      createPanelDescription: t('client.createPanelDescription'),
      createResultTitle: t('client.createResultTitle'),
      createResultDescription: t('client.createResultDescription'),
      nameLabel: t('client.nameLabel'),
      namePlaceholder: t('client.namePlaceholder'),
      remarkLabel: t('client.remarkLabel'),
      remarkPlaceholder: t('client.remarkPlaceholder'),
      expiresInLabel: t('client.expiresInLabel'),
      expiresInEmpty: t('client.expiresInEmpty'),
      expiresInOptions: {
        '3_months': t('client.expiresInOptions.3_months'),
        '6_months': t('client.expiresInOptions.6_months'),
        '1_year': t('client.expiresInOptions.1_year'),
        never: t('client.expiresInOptions.never'),
      },
      createButton: t('client.createButton'),
      creating: t('client.creating'),
      closePanel: t('client.closePanel'),
      cancel: t('client.cancel'),
      confirm: t('client.confirm'),
      deleteClientTitle: t('client.deleteClientTitle'),
      deleteClientDescription: t('client.deleteClientDescription'),
      deleteClientPendingTitle: t('client.deleteClientPendingTitle'),
      deleteClientPendingDescription: t('client.deleteClientPendingDescription'),
      detail: t('client.detail'),
      delete: t('client.delete'),
      deleting: t('client.deleting'),
      undo: t('client.undo'),
      copied: t('client.copied'),
      copyEnvBlock: t('client.copyEnvBlock'),
      showSecret: t('client.showSecret'),
      hideSecret: t('client.hideSecret'),
    },
  };
}

export async function getOuterClientDetailPageCopy(locale: string): Promise<OuterClientDetailPageCopy> {
  const t = await getTranslations({ locale, namespace: 'clientPage.detail' });

  return {
    title: t('title'),
    description: t('description'),
    actions: {
      backToClients: t('actions.backToClients'),
    },
    client: {
      loading: t('client.loading'),
      loadFailed: t('client.loadFailed'),
      notFound: t('client.notFound'),
      generateKeyTitle: t('client.generateKeyTitle'),
      generateKeyDescription: t('client.generateKeyDescription'),
      expiresInLabel: t('client.expiresInLabel'),
      expiresInEmpty: t('client.expiresInEmpty'),
      expiresInOptions: {
        '3_months': t('client.expiresInOptions.3_months'),
        '6_months': t('client.expiresInOptions.6_months'),
        '1_year': t('client.expiresInOptions.1_year'),
        never: t('client.expiresInOptions.never'),
      },
      generateKey: t('client.generateKey'),
      generating: t('client.generating'),
      currentActiveKeyTitle: t('client.currentActiveKeyTitle'),
      deActiveKeysTitle: t('client.deActiveKeysTitle'),
      generatedKeyTitle: t('client.generatedKeyTitle'),
      generatedKeyDescription: t('client.generatedKeyDescription'),
      unsavedLeaveTitle: t('client.unsavedLeaveTitle'),
      unsavedLeaveDescription: t('client.unsavedLeaveDescription'),
      deleteClientTitle: t('client.deleteClientTitle'),
      deleteClientDescription: t('client.deleteClientDescription'),
      deleteActiveKeyTitle: t('client.deleteActiveKeyTitle'),
      deleteActiveKeyDescription: t('client.deleteActiveKeyDescription'),
      deleteKeyTitle: t('client.deleteKeyTitle'),
      deleteKeyDescription: t('client.deleteKeyDescription'),
      deleteKeyPendingTitle: t('client.deleteKeyPendingTitle'),
      deleteKeyPendingDescription: t('client.deleteKeyPendingDescription'),
      cancel: t('client.cancel'),
      confirm: t('client.confirm'),
      undo: t('client.undo'),
      closeSecret: t('client.closeSecret'),
      closeDialog: t('client.closeDialog'),
      copyEnvBlock: t('client.copyEnvBlock'),
      copied: t('client.copied'),
      showSecret: t('client.showSecret'),
      hideSecret: t('client.hideSecret'),
      noKeys: t('client.noKeys'),
      backToClients: t('actions.backToClients'),
      privateKeyLabel: t('client.privateKeyLabel'),
      rotatingGraceHint: t('client.rotatingGraceHint'),
      deleteKey: t('client.deleteKey'),
      extendKey: t('client.extendKey'),
      extendByLabel: t('client.extendByLabel'),
      extending: t('client.extending'),
      deleting: t('client.deleting'),
      keys: {
        keyVersion: t('client.keys.keyVersion'),
        algorithm: t('client.keys.algorithm'),
        fingerprint: t('client.keys.fingerprint'),
        expiresAt: t('client.keys.expiresAt'),
        lastUsedAt: t('client.keys.lastUsedAt'),
        createdAt: t('client.keys.createdAt'),
        publicKey: t('client.keys.publicKey'),
      },
    },
  };
}
