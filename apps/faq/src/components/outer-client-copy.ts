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
    detail: string;
    delete: string;
    deleting: string;
    copied: string;
    copyEnvBlock: string;
    showSecret: string;
    hideSecret: string;
    environment: string;
    clientId: string;
    keyCount: string;
    activeKeyCount: string;
    updatedAt: string;
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
    environmentLabel: string;
    expiresAtLabel: string;
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
    cancel: string;
    confirm: string;
    closeSecret: string;
    closeDialog: string;
    copyPublicKey: string;
    copyPrivateKey: string;
    copyEnvBlock: string;
    copied: string;
    showSecret: string;
    hideSecret: string;
    secretMasked: string;
    noKeys: string;
    backToClients: string;
    privateKeyLabel: string;
    envBlockTitle: string;
    envBlockDescription: string;
    rotatingGraceHint: string;
    deleteKey: string;
    extendKey: string;
    extendByLabel: string;
    extending: string;
    deleting: string;
    deleteClient: string;
    summaryTitle: string;
    secretCardHint: string;
    summary: {
      clientId: string;
      name: string;
      status: string;
      remark: string;
      environment: string;
      keyCount: string;
      activeKeyCount: string;
    };
    keys: {
      environment: string;
      keyVersion: string;
      algorithm: string;
      fingerprint: string;
      status: string;
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
      detail: t('client.detail'),
      delete: t('client.delete'),
      deleting: t('client.deleting'),
      copied: t('client.copied'),
      copyEnvBlock: t('client.copyEnvBlock'),
      showSecret: t('client.showSecret'),
      hideSecret: t('client.hideSecret'),
      environment: t('client.environment'),
      clientId: t('client.clientId'),
      keyCount: t('client.keyCount'),
      activeKeyCount: t('client.activeKeyCount'),
      updatedAt: t('client.updatedAt'),
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
      environmentLabel: t('client.environmentLabel'),
      expiresAtLabel: t('client.expiresAtLabel'),
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
      cancel: t('client.cancel'),
      confirm: t('client.confirm'),
      closeSecret: t('client.closeSecret'),
      closeDialog: t('client.closeDialog'),
      copyPublicKey: t('client.copyPublicKey'),
      copyPrivateKey: t('client.copyPrivateKey'),
      copyEnvBlock: t('client.copyEnvBlock'),
      copied: t('client.copied'),
      showSecret: t('client.showSecret'),
      hideSecret: t('client.hideSecret'),
      secretMasked: t('client.secretMasked'),
      noKeys: t('client.noKeys'),
      backToClients: t('actions.backToClients'),
      privateKeyLabel: t('client.privateKeyLabel'),
      envBlockTitle: t('client.envBlockTitle'),
      envBlockDescription: t('client.envBlockDescription'),
      rotatingGraceHint: t('client.rotatingGraceHint'),
      deleteKey: t('client.deleteKey'),
      extendKey: t('client.extendKey'),
      extendByLabel: t('client.extendByLabel'),
      extending: t('client.extending'),
      deleting: t('client.deleting'),
      deleteClient: t('client.deleteClient'),
      summaryTitle: t('client.summaryTitle'),
      secretCardHint: t('client.secretCardHint'),
      summary: {
        clientId: t('client.summary.clientId'),
        name: t('client.summary.name'),
        status: t('client.summary.status'),
        remark: t('client.summary.remark'),
        environment: t('client.summary.environment'),
        keyCount: t('client.summary.keyCount'),
        activeKeyCount: t('client.summary.activeKeyCount'),
      },
      keys: {
        environment: t('client.keys.environment'),
        keyVersion: t('client.keys.keyVersion'),
        algorithm: t('client.keys.algorithm'),
        fingerprint: t('client.keys.fingerprint'),
        status: t('client.keys.status'),
        expiresAt: t('client.keys.expiresAt'),
        lastUsedAt: t('client.keys.lastUsedAt'),
        createdAt: t('client.keys.createdAt'),
        publicKey: t('client.keys.publicKey'),
      },
    },
  };
}
