import type {
  OuterApiVersion,
  OuterQuestionBaseQuery,
  OuterQuestionBaseResult,
} from '@windrun-huaiin/faq-contracts/outer/v1';

export type AnswersUniverseClientOptions = {
  baseUrl: string;
  version?: OuterApiVersion;
  clientId: string;
  keyVersion: string;
  publicKey: string;
  privateKey: string;
  fetch?: typeof fetch;
};

export type AnswersUniverseResolvedOptions = Required<
  Pick<
    AnswersUniverseClientOptions,
    'baseUrl' | 'clientId' | 'keyVersion' | 'publicKey' | 'privateKey' | 'version' | 'fetch'
  >
>;

export type AnswersUniverseQuestionsBaseClient = {
  getByIds(ids: string[]): Promise<OuterQuestionBaseResult>;
  query(params: OuterQuestionBaseQuery): Promise<OuterQuestionBaseResult>;
};

export type AnswersUniverseClient = {
  options: AnswersUniverseResolvedOptions;
  v1: {
    questionsBase: AnswersUniverseQuestionsBaseClient;
  };
};
