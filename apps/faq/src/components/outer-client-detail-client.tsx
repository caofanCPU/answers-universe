'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, BookmarkPlusIcon, CoinsIcon, CopyIcon, EyeIcon, EyeOffIcon, Trash2Icon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { XButton } from '@windrun-huaiin/third-ui/main';
import { XFormPills } from '@windrun-huaiin/third-ui/main/pill-select';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import type {
  OuterClientDetailDto,
  OuterClientExpiryOption,
  OuterClientKeyIssueResult,
  OuterClientKeySummaryDto,
} from '@/server/outer-clients/types';
import type { OuterClientDetailPageCopy } from './outer-client-copy';
import { OuterClientActionModal } from './outer-client-action-modal';

type OuterClientDetailClientProps = {
  locale: string;
  clientId: string;
  copy: OuterClientDetailPageCopy['client'];
};

type SecretState = OuterClientKeyIssueResult | null;
type PendingLeaveAction =
  | { kind: 'dismiss-secret' }
  | { kind: 'navigate'; href: string }
  | { kind: 'delete-active-key'; keyVersion: string }
  | null;

function getEnvVariableNames() {
  return {
    baseUrl: 'WINDRUN_HUAIIN_FAQ_BASE_URL',
    sdkDebug: 'WINDRUN_HUAIIN_SDK_DEBUG',
    publicKey: 'NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK',
    privateKey: 'WINDRUN_HUAIIN_FAQ_SK',
  };
}

function formatTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '-';
}

function maskSecret(value: string): string {
  if (value.length <= 18) {
    return '••••••••';
  }

  return `${value.slice(0, 12)}••••••••${value.slice(-12)}`;
}

function resolveFaqBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return 'http://localhost:3000';
}

export function OuterClientDetailClient({ locale, clientId, copy }: OuterClientDetailClientProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<OuterClientDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [issuingPanelOpen, setIssuingPanelOpen] = useState(false);
  const [deletingKeyVersion, setDeletingKeyVersion] = useState<string | null>(null);
  const [extendingKeyVersion, setExtendingKeyVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<OuterClientExpiryOption>('1_year');
  const [extendSelection, setExtendSelection] = useState<Record<string, OuterClientExpiryOption>>({});
  const [oneTimeSecret, setOneTimeSecret] = useState<SecretState>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<'env' | null>(null);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<PendingLeaveAction>(null);

  const backHref = getAsNeededLocalizedUrl(locale, '/questions/clients');

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/clients/${encodeURIComponent(clientId)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setDetail(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as OuterClientDetailDto;
      setDetail(data);
      setLoading(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedField(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!oneTimeSecret) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [oneTimeSecret]);

  async function issueKey() {
    if (issuing) {
      return;
    }

    setIssuing(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/clients/${encodeURIComponent(clientId)}/keys`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          expiresIn,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as OuterClientKeyIssueResult;
      setOneTimeSecret(data);
      setShowSecret(false);
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
    } finally {
      setIssuing(false);
    }
  }

  async function handleDeleteKey(keyVersion: string) {
    if (deletingKeyVersion) {
      return;
    }

    setDeletingKeyVersion(keyVersion);
    setError(null);

    try {
      const response = await fetch(
        `/api/questions/clients/${encodeURIComponent(clientId)}/keys/${encodeURIComponent(keyVersion)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setPendingLeaveAction(null);
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
    } finally {
      setDeletingKeyVersion(null);
    }
  }

  async function handleExtendKey(keyVersion: string) {
    if (extendingKeyVersion) {
      return;
    }

    const extendBy = extendSelection[keyVersion] ?? '3_months';
    setExtendingKeyVersion(keyVersion);
    setError(null);

    try {
      const response = await fetch(
        `/api/questions/clients/${encodeURIComponent(clientId)}/keys/${encodeURIComponent(keyVersion)}/extend`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            extendBy,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
    } finally {
      setExtendingKeyVersion(null);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField('env');
  }

  const activeSecretMask = useMemo(
    () => (oneTimeSecret ? maskSecret(oneTimeSecret.privateKey) : copy.secretMasked),
    [copy.secretMasked, oneTimeSecret]
  );

  const envBlock = useMemo(() => {
    if (!oneTimeSecret) {
      return '';
    }

    const variableNames = getEnvVariableNames();
    const privateValue = showSecret ? oneTimeSecret.privateKey : activeSecretMask;

    return [
      `${variableNames.baseUrl}=${resolveFaqBaseUrl()}`,
      `WINDRUN_HUAIIN_FAQ_CLIENT_ID=${oneTimeSecret.clientId}`,
      `WINDRUN_HUAIIN_FAQ_KEY_VERSION=${oneTimeSecret.keyVersion}`,
      `${variableNames.publicKey}=${oneTimeSecret.publicKey}`,
      `${variableNames.privateKey}=${privateValue}`,
      `${variableNames.sdkDebug}=false`,
    ].join('\n');
  }, [activeSecretMask, oneTimeSecret, showSecret]);

  const copyableEnvBlock = useMemo(() => {
    if (!oneTimeSecret) {
      return '';
    }

    const variableNames = getEnvVariableNames();
    return [
      `${variableNames.baseUrl}=${resolveFaqBaseUrl()}`,
      `WINDRUN_HUAIIN_FAQ_CLIENT_ID=${oneTimeSecret.clientId}`,
      `WINDRUN_HUAIIN_FAQ_KEY_VERSION=${oneTimeSecret.keyVersion}`,
      `${variableNames.publicKey}=${oneTimeSecret.publicKey}`,
      `${variableNames.privateKey}=${oneTimeSecret.privateKey}`,
      `${variableNames.sdkDebug}=false`,
    ].join('\n');
  }, [oneTimeSecret]);

  const expiresInOptions = [
    { label: copy.expiresInOptions['3_months'], value: '3_months' },
    { label: copy.expiresInOptions['6_months'], value: '6_months' },
    { label: copy.expiresInOptions['1_year'], value: '1_year' },
    { label: copy.expiresInOptions.never, value: 'never' },
  ];

  const activeKey = detail?.keys.find((item) => item.status === 'active') ?? null;
  const otherKeys = detail?.keys.filter((item) => item.status !== 'active') ?? [];


  function requestNavigate(href: string) {
    if (!oneTimeSecret) {
      router.push(href);
      return;
    }

    setPendingLeaveAction({ kind: 'navigate', href });
  }

  function closeIssuePanel() {
    setIssuingPanelOpen(false);
    setExpiresIn('1_year');
    setShowSecret(false);
    setCopiedField(null);
    setOneTimeSecret(null);
  }

  function confirmLeaveAction() {
    if (!pendingLeaveAction) {
      return;
    }

    if (pendingLeaveAction.kind === 'dismiss-secret') {
      setOneTimeSecret(null);
      setShowSecret(false);
      setCopiedField(null);
      setPendingLeaveAction(null);
      return;
    }

    if (pendingLeaveAction.kind === 'delete-active-key') {
      void handleDeleteKey(pendingLeaveAction.keyVersion);
      return;
    }

    const href = pendingLeaveAction.href;
    setOneTimeSecret(null);
    setShowSecret(false);
    setCopiedField(null);
    setPendingLeaveAction(null);
    router.push(href);
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex justify-end">
        <Link
          href={backHref}
          onClick={(event) => {
            if (!oneTimeSecret) {
              return;
            }

            event.preventDefault();
            requestNavigate(backHref);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:bg-neutral-950 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>{copy.backToClients}</span>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          {copy.loading}
        </div>
      ) : !detail ? (
        <div className="rounded-[1.75rem] border border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          {copy.notFound}
        </div>
      ) : (
        <>
          <section className="rounded-4xl border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/70 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={detail.status} />
                <MetaTag value={`${detail.activeKeyCount}/${detail.keyCount}`} tone="emerald" minWidth="min-w-18" />
                {detail.environment ? <EnvPill value={detail.environment} /> : null}
                <ClientIdPill value={detail.clientId} />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{detail.name}</h2>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{detail.remark || '-'}</p>
                </div>

                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <XButton
                    type="single"
                    variant="subtle"
                    button={{
                      text: issuing ? copy.generating : copy.generateKey,
                      icon: <BookmarkPlusIcon className="h-4 w-4" />,
                      disabled: issuing,
                      onClick: () => setIssuingPanelOpen(true),
                    }}
                  />
                  <p className="max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400 lg:text-right">{copy.rotatingGraceHint}</p>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {copy.loadFailed}
              {error}
            </div>
          ) : null}

          {activeKey ? (
            <section className="rounded-4xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 sm:p-5">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{copy.currentActiveKeyTitle}</h3>
              </div>
              <KeyCard
                keyItem={activeKey}
                copy={copy}
                expiresInOptions={expiresInOptions}
                extendValue={extendSelection[activeKey.keyVersion] ?? '3_months'}
                onChangeExtend={(value) =>
                  setExtendSelection((current) => ({
                    ...current,
                    [activeKey.keyVersion]: value,
                  }))
                }
                onExtend={() => void handleExtendKey(activeKey.keyVersion)}
                onDelete={() => setPendingLeaveAction({ kind: 'delete-active-key', keyVersion: activeKey.keyVersion })}
                extending={extendingKeyVersion === activeKey.keyVersion}
                deleting={deletingKeyVersion === activeKey.keyVersion}
              />
            </section>
          ) : null}

          <section className="rounded-4xl border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/70 sm:p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{copy.deActiveKeysTitle}</h3>

              {otherKeys.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {copy.noKeys}
                </div>
              ) : (
                <div className="grid gap-4">
                  {otherKeys.map((key) => (
                    <KeyCard
                      key={`${key.environment}-${key.keyVersion}`}
                      keyItem={key}
                      copy={copy}
                      expiresInOptions={expiresInOptions}
                      extendValue={extendSelection[key.keyVersion] ?? '3_months'}
                      onChangeExtend={(value) =>
                        setExtendSelection((current) => ({
                          ...current,
                          [key.keyVersion]: value,
                        }))
                      }
                      onExtend={() => void handleExtendKey(key.keyVersion)}
                      onDelete={() => void handleDeleteKey(key.keyVersion)}
                      extending={extendingKeyVersion === key.keyVersion}
                      deleting={deletingKeyVersion === key.keyVersion}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <OuterClientActionModal
        open={issuingPanelOpen}
        title={oneTimeSecret ? copy.generatedKeyTitle : copy.generateKeyTitle}
        description={oneTimeSecret ? copy.generatedKeyDescription : copy.generateKeyDescription}
        closeLabel={copy.closeSecret}
        onClose={closeIssuePanel}
        formContent={
          <section className="rounded-3xl border border-black/10 bg-neutral-50/80 p-3.5 dark:border-white/10 dark:bg-neutral-900/60 sm:rounded-[1.75rem] sm:p-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950 sm:p-3">
                <XFormPills
                  label={<span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.expiresInLabel}</span>}
                  value={expiresIn}
                  options={expiresInOptions}
                  onChange={(value) => setExpiresIn(value as OuterClientExpiryOption)}
                  emptyLabel={copy.expiresInEmpty}
                />
              </div>

              <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-neutral-950/60 dark:text-slate-300">
                {copy.rotatingGraceHint}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <XButton
                  type="single"
                  variant="subtle"
                  button={{
                    text: copy.cancel,
                    icon: false,
                    onClick: closeIssuePanel,
                  }}
                />
                <XButton
                  type="single"
                  variant="subtle"
                  button={{
                    text: issuing ? copy.generating : copy.generateKey,
                    icon: <BookmarkPlusIcon className="h-4 w-4" />,
                    disabled: issuing,
                    onClick: () => void issueKey(),
                  }}
                />
              </div>
            </div>
          </section>
        }
        resultContent={
          <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-3.5 dark:border-amber-400/20 dark:bg-amber-500/10 sm:rounded-[1.75rem] sm:p-4">
            {!oneTimeSecret ? (
              <div className="flex h-full min-h-48 items-center justify-center rounded-3xl border border-dashed border-amber-300/80 px-4 text-center text-sm leading-6 text-slate-600 dark:border-amber-400/25 dark:text-slate-300 sm:min-h-56 sm:px-6">
                {copy.generatedKeyDescription}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <InfoPill label={copy.summary.clientId} value={oneTimeSecret.clientId} />
                  <InfoPill label={copy.keys.environment} value={oneTimeSecret.environment} />
                  <InfoPill label={copy.keys.keyVersion} value={oneTimeSecret.keyVersion} />
                </div>

                <div className="rounded-3xl border border-black/10 bg-white/90 p-4 dark:border-white/10 dark:bg-neutral-950/85">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {copy.envBlockTitle}
                      </div>
                      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{copy.envBlockDescription}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSecret((value) => !value)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-white/5"
                        aria-label={showSecret ? copy.hideSecret : copy.showSecret}
                        title={showSecret ? copy.hideSecret : copy.showSecret}
                      >
                        {showSecret ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <XButton
                        type="single"
                        variant="subtle"
                        button={{
                          text: copiedField === 'env' ? copy.copied : copy.copyEnvBlock,
                          icon: <CopyIcon className="h-4 w-4" />,
                          onClick: () => void copyText(copyableEnvBlock),
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-neutral-100 p-4 font-mono text-xs leading-6 text-slate-800 dark:bg-neutral-900 dark:text-slate-200 break-all whitespace-pre-wrap">
                    {envBlock}
                  </div>

                  {!showSecret ? (
                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{copy.secretMasked}</p>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        }
      />

      {pendingLeaveAction ? (
        <div
          className="fixed inset-0 z-50 mt-24 flex items-end justify-center bg-slate-950/45 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:pb-0"
          onClick={() => setPendingLeaveAction(null)}
        >
          <div
            className="w-full max-w-lg rounded-4xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {pendingLeaveAction.kind === 'delete-active-key' ? copy.deleteActiveKeyTitle : copy.unsavedLeaveTitle}
                </h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {pendingLeaveAction.kind === 'delete-active-key' ? copy.deleteActiveKeyDescription : copy.unsavedLeaveDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingLeaveAction(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-600 transition hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label={copy.closeDialog}
                title={copy.closeDialog}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <XButton
                type="single"
                variant="subtle"
                button={{
                  text: copy.cancel,
                  icon: false,
                  onClick: () => setPendingLeaveAction(null),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                button={{
                  text:
                    pendingLeaveAction.kind === 'delete-active-key' && deletingKeyVersion === pendingLeaveAction.keyVersion
                      ? copy.deleting
                      : copy.confirm,
                  icon: <Trash2Icon className="h-4 w-4" />,
                  onClick: confirmLeaveAction,
                  disabled:
                    pendingLeaveAction.kind === 'delete-active-key' && deletingKeyVersion === pendingLeaveAction.keyVersion,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-neutral-950/80">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
      {value}
    </span>
  );
}

function EnvPill({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
      {value}
    </span>
  );
}

function ClientIdPill({ value }: { value: string }) {
  return (
    <span className="break-all rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
      {value}
    </span>
  );
}

function MetaTag({ value, tone, minWidth }: { value: string; tone: 'emerald' | 'slate'; minWidth?: string }) {
  const toneClassName =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200';

  return <span className={`rounded-full px-3 py-1 text-center text-xs font-medium ${minWidth ?? ''} ${toneClassName}`}>{value}</span>;
}

function KeyInfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-950">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function KeyCard({
  keyItem,
  copy,
  expiresInOptions,
  extendValue,
  onChangeExtend,
  onExtend,
  onDelete,
  extending,
  deleting,
}: {
  keyItem: OuterClientKeySummaryDto;
  copy: OuterClientDetailPageCopy['client'];
  expiresInOptions: { label: string; value: string }[];
  extendValue: OuterClientExpiryOption;
  onChangeExtend: (value: OuterClientExpiryOption) => void;
  onExtend: () => void;
  onDelete: () => void;
  extending: boolean;
  deleting: boolean;
}) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white px-4 py-4 dark:border-white/10 dark:bg-neutral-900 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <EnvPill value={keyItem.environment} />
          <StatusPill value={keyItem.status} />
        </div>

        <div className="grid gap-2">
          <KeyInfoCell label={copy.keys.publicKey} value={keyItem.publicKey} />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <KeyInfoCell label={copy.keys.keyVersion} value={keyItem.keyVersion} />
          <KeyInfoCell label={copy.keys.algorithm} value={keyItem.algorithm} />
          <KeyInfoCell label={copy.privateKeyLabel} value="--" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <KeyInfoCell label={copy.keys.expiresAt} value={formatTime(keyItem.expiresAt)} />
          <KeyInfoCell label={copy.keys.lastUsedAt} value={formatTime(keyItem.lastUsedAt)} />
          <KeyInfoCell label={copy.keys.createdAt} value={formatTime(keyItem.createdAt)} />
        </div>

        <div className="grid gap-2">
          <KeyInfoCell label={copy.keys.fingerprint} value={keyItem.fingerprint || '-'} />
        </div>

        <div className="grid gap-3 border-t border-black/10 pt-4 dark:border-white/10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="rounded-2xl border border-black/10 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-neutral-950/70">
            <XFormPills
              label={<span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.extendByLabel}</span>}
              value={extendValue}
              options={expiresInOptions}
              onChange={(value) => onChangeExtend(value as OuterClientExpiryOption)}
              emptyLabel={copy.expiresInEmpty}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="shrink-0">
              <XButton
                type="single"
                variant="subtle"
                button={{
                  text: extending ? copy.extending : copy.extendKey,
                  icon: <CoinsIcon className="h-4 w-4" />,
                  disabled: extending,
                  onClick: onExtend,
                }}
              />
            </div>
            <div className="shrink-0">
              <XButton
                type="single"
                variant="subtle"
                button={{
                  text: deleting ? copy.deleting : copy.deleteKey,
                  icon: <Trash2Icon className="h-4 w-4" />,
                  disabled: deleting,
                  onClick: onDelete,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
