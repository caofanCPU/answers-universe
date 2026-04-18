export type OuterClientListItemDto = {
  clientId: string;
  name: string;
  status: string;
  remark: string | null;
  environment: string | null;
  keyCount: number;
  activeKeyCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OuterClientDetailDto = OuterClientListItemDto & {
  keys: OuterClientKeySummaryDto[];
};

export type OuterClientKeySummaryDto = {
  environment: string;
  keyVersion: string;
  algorithm: string;
  publicKey: string;
  fingerprint: string | null;
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OuterClientMutationResult = {
  clientId: string;
  environment: string;
  keyVersion: string;
  publicKey: string;
  privateKey: string;
};

export type OuterClientKeyIssueResult = {
  clientId: string;
  environment: string;
  keyVersion: string;
  algorithm: string;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
};

export type OuterClientExpiryOption = '3_months' | '6_months' | '1_year' | 'never';
