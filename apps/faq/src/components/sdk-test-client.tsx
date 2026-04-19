'use client';

import { useMemo, useState } from 'react';
import type { OuterQuestionBaseResult, OuterQuestionDetailDto } from '@windrun-huaiin/faq-contracts/outer/v1';
import { XButton } from '@windrun-huaiin/third-ui/main';
import { XTokenInput } from '@windrun-huaiin/third-ui/main/pill-select';

type SdkTestResult = {
  ids: string[];
  baseResult: OuterQuestionBaseResult;
  detail: OuterQuestionDetailDto | null;
};

function normalizeIds(tokens: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const normalized = token.trim().replace(/^0+(?=\d)/, '');

    if (!/^\d+$/.test(normalized) || normalized === '0' || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function getInvalidTokens(tokens: string[]): string[] {
  return tokens.filter((token) => {
    const normalized = token.trim().replace(/^0+(?=\d)/, '');
    return !/^\d+$/.test(normalized) || normalized === '0';
  });
}

export function SdkTestClient() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SdkTestResult | null>(null);
  const normalizedIds = useMemo(() => normalizeIds(tokens), [tokens]);
  const invalidTokens = useMemo(() => getInvalidTokens(tokens), [tokens]);
  const canSubmit = normalizedIds.length > 0 && !loading;

  async function runSdkTest() {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/internal/questions/sdk-test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ids: normalizedIds }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? 'SDK test request failed');
      }

      setResult(payload as SdkTestResult);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : 'SDK test request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">SDK query input</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter numeric question ids. The browser sends ids to an internal test route; that route uses the SDK on the server.
          </p>
        </div>
        <XTokenInput
          value={tokens}
          onChange={setTokens}
          placeholder="Type an id and press Enter, for example 10001"
          emptyLabel="No ids yet"
          size="compact"
        />
        <div className="flex flex-wrap items-center gap-3">
          <XButton
            type="single"
            loadingText="Querying..."
            button={{
              icon: false,
              text: 'Run SDK query',
              onClick: runSdkTest,
              disabled: !canSubmit,
            }}
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Valid ids: {normalizedIds.length > 0 ? normalizedIds.join(', ') : 'none'}
          </span>
        </div>
        {invalidTokens.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            Ignored invalid tokens: {invalidTokens.join(', ')}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">questionsBase.getByIds</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Returned {result.baseResult.items.length} item(s).
              </p>
            </div>
            <div className="space-y-3">
              {result.baseResult.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="font-medium text-slate-900 dark:text-white">#{item.id} {item.question}</div>
                  <div className="mt-2 grid gap-1 text-slate-500 dark:text-slate-400">
                    <span>uuid: {item.uuid}</span>
                    <span>category: {item.category}</span>
                    <span>difficulty: {item.difficulty}</span>
                    <span>asFirst: {String(item.asFirst)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">questionDetail.getById</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Detail is fetched for the first returned base item.
              </p>
            </div>
            {result.detail ? (
              <article className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="font-medium text-slate-900 dark:text-white">#{result.detail.id} {result.detail.question}</div>
                <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                  <p><span className="font-medium">Correct answer:</span> {result.detail.correctAnswer}</p>
                  <p><span className="font-medium">Explanation:</span> {result.detail.explanation}</p>
                  <p><span className="font-medium">Incorrect answers:</span> {result.detail.incorrectAnswers.join(', ')}</p>
                </div>
              </article>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No detail fetched because the base query returned no items.
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
