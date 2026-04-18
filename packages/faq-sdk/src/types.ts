import type {
  OuterApiVersion,
  OuterQuestionBaseQuery,
  OuterQuestionBaseResult,
  OuterQuestionDetailDto,
} from '@windrun-huaiin/faq-contracts/outer/v1';

export type AnswersUniverseClientOptions = {
  baseUrl: string;
  version?: OuterApiVersion;
  clientId: string;
  keyVersion: string;
  publicKey: string;
  privateKey: string;
  idsBatchSize?: number;
  parallelism?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

export type AnswersUniverseResolvedOptions = Required<
  Pick<
    AnswersUniverseClientOptions,
    'baseUrl' | 'clientId' | 'keyVersion' | 'publicKey' | 'privateKey' | 'version' | 'timeoutMs' | 'fetch'
  >
> & {
  idsBatchSize: number;
  parallelism: number;
};

export type AnswersUniverseQuestionsBaseClient = {
  getByIds(ids: string[]): Promise<OuterQuestionBaseResult>;
  query(params: OuterQuestionBaseQuery): Promise<OuterQuestionBaseResult>;
};

export type AnswersUniverseQuestionDetailClient = {
  getById(id: string): Promise<OuterQuestionDetailDto>;
};

export type AnswersUniverseClient = {
  options: AnswersUniverseResolvedOptions;
  v1: {
    questionsBase: AnswersUniverseQuestionsBaseClient;
    questionDetail: AnswersUniverseQuestionDetailClient;
  };
};
