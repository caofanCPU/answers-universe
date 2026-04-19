'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CopyIcon, EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { XButton } from '@windrun-huaiin/third-ui/main';
import { XFormPills } from '@windrun-huaiin/third-ui/main/pill-select';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import type { OuterClientExpiryOption, OuterClientKeyIssueResult, OuterClientListItemDto } from '@/server/outer-clients/types';
import type { OuterClientsPageCopy } from './outer-client-copy';
import { OuterClientActionModal } from './outer-client-action-modal';

type OuterClientsClientProps = {
  locale: string;
  copy: OuterClientsPageCopy['client'];
};

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

function buildEnvBlock(secret: OuterClientKeyIssueResult, showSecret: boolean, baseUrl: string): string {
  const privateValue = showSecret ? secret.privateKey : maskSecret(secret.privateKey);

  return [
    `WINDRUN_HUAIIN_FAQ_BASE_URL=${baseUrl}`,
    `WINDRUN_HUAIIN_FAQ_CLIENT_ID=${secret.clientId}`,
    `WINDRUN_HUAIIN_FAQ_KEY_VERSION=${secret.keyVersion}`,
    `NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK=${secret.publicKey}`,
    `WINDRUN_HUAIIN_FAQ_SK=${privateValue}`,
    'WINDRUN_HUAIIN_SDK_DEBUG=false',
  ].join('\n');
}

function buildCopyableEnvBlock(secret: OuterClientKeyIssueResult, baseUrl: string): string {
  return [
    `WINDRUN_HUAIIN_FAQ_BASE_URL=${baseUrl}`,
    `WINDRUN_HUAIIN_FAQ_CLIENT_ID=${secret.clientId}`,
    `WINDRUN_HUAIIN_FAQ_KEY_VERSION=${secret.keyVersion}`,
    `NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK=${secret.publicKey}`,
    `WINDRUN_HUAIIN_FAQ_SK=${secret.privateKey}`,
    'WINDRUN_HUAIIN_SDK_DEBUG=false',
  ].join('\n');
}

function formatTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '-';
}

export function OuterClientsClient({ locale, copy }: OuterClientsClientProps) {
  const [items, setItems] = useState<OuterClientListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [pendingDeleteClientId, setPendingDeleteClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [expiresIn, setExpiresIn] = useState<OuterClientExpiryOption>('1_year');
  const [createdSecret, setCreatedSecret] = useState<OuterClientKeyIssueResult | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<'env' | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/questions/clients', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as OuterClientListItemDto[];
      setItems(data);
      setLoading(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedField(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  async function handleCreate() {
    if (!name.trim() || creating) {
      return;
    }

    setCreating(true);
    setError(null);
    setCreatedSecret(null);
    setShowSecret(false);

    try {
      const response = await fetch('/api/questions/clients', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          remark: remark.trim() || null,
          expiresIn,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as OuterClientKeyIssueResult;
      setCreatedSecret(data);
      setName('');
      setRemark('');
      await loadClients();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(clientId: string) {
    if (deletingClientId) {
      return;
    }

    setDeletingClientId(clientId);
    setError(null);

    try {
      const response = await fetch(`/api/questions/clients/${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setPendingDeleteClientId(null);
      await loadClients();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unknown error');
    } finally {
      setDeletingClientId(null);
    }
  }

  function closeCreatePanel() {
    setPanelOpen(false);
    setCreatedSecret(null);
    setShowSecret(false);
    setCopiedField(null);
  }

  async function copyEnvBlock() {
    if (!createdSecret) {
      return;
    }

    await navigator.clipboard.writeText(buildCopyableEnvBlock(createdSecret, resolveFaqBaseUrl()));
    setCopiedField('env');
  }

  const expiresInOptions = [
    { label: copy.expiresInOptions['3_months'], value: '3_months' },
    { label: copy.expiresInOptions['6_months'], value: '6_months' },
    { label: copy.expiresInOptions['1_year'], value: '1_year' },
    { label: copy.expiresInOptions.never, value: 'never' },
  ];

  const envBlock = useMemo(
    () => (createdSecret ? buildEnvBlock(createdSecret, showSecret, resolveFaqBaseUrl()) : ''),
    [createdSecret, showSecret]
  );

  return (
    <div className="flex min-h-[80vh] flex-col gap-5 sm:gap-6">
      <section className="rounded-4xl border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/70 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{copy.createTitle}</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.createDescription}</p>
          </div>
          <XButton
            type="single"
            variant="subtle"
            button={{
              text: copy.createOpen,
              icon: <PlusIcon className="h-4 w-4" />,
              onClick: () => setPanelOpen(true),
            }}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          {copy.loadFailed}
          {error}
        </div>
      ) : null}

      <section className="rounded-4xl border border-black/10 bg-neutral-50/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/60 sm:p-5">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {copy.loading}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/10 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            {copy.empty}
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <article
                key={item.clientId}
                className="rounded-[1.75rem] border border-black/10 bg-white px-4 py-4 dark:border-white/10 dark:bg-neutral-900 sm:px-5"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={item.status} />
                    {item.environment ? <EnvPill value={item.environment} /> : null}
                    <ClientIdPill value={item.clientId} />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{item.name}</h3>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="min-w-0 space-y-3">
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.remark || '-'}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <MetaTag value={`${item.activeKeyCount}/${item.keyCount}`} tone="emerald" minWidth="min-w-18" />
                        <MetaTag value={formatTime(item.updatedAt)} tone="slate" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="shrink-0">
                        <XButton
                          type="single"
                          variant="subtle"
                          button={{
                            text: deletingClientId === item.clientId ? copy.deleting : copy.delete,
                            icon: <Trash2Icon className="h-4 w-4" />,
                            disabled: deletingClientId === item.clientId,
                            onClick: () => setPendingDeleteClientId(item.clientId),
                          }}
                        />
                      </div>
                      <Link href={getAsNeededLocalizedUrl(locale, `/questions/clients/${item.clientId}`)} className="block shrink-0">
                        <XButton
                          type="single"
                          variant="subtle"
                          button={{
                            text: copy.detail,
                            icon: <EyeIcon className="h-4 w-4" />,
                            onClick: () => undefined,
                          }}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pendingDeleteClientId ? (
        <div
          className="fixed inset-0 z-50 mt-24 flex items-end justify-center bg-slate-950/45 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:pb-0"
          onClick={() => setPendingDeleteClientId(null)}
        >
          <div
            className="w-full max-w-lg rounded-4xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{copy.deleteClientTitle}</h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.deleteClientDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteClientId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-black/5 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-white/5"
                aria-label={copy.closePanel}
                title={copy.closePanel}
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
                  onClick: () => setPendingDeleteClientId(null),
                }}
              />
              <XButton
                type="single"
                variant="subtle"
                button={{
                  text: deletingClientId === pendingDeleteClientId ? copy.deleting : copy.confirm,
                  icon: <Trash2Icon className="h-4 w-4" />,
                  disabled: deletingClientId === pendingDeleteClientId,
                  onClick: () => void handleDelete(pendingDeleteClientId),
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <OuterClientActionModal
        open={panelOpen}
        title={createdSecret ? copy.createResultTitle : copy.createPanelTitle}
        description={createdSecret ? copy.createResultDescription : copy.createPanelDescription}
        closeLabel={copy.closePanel}
        onClose={closeCreatePanel}
        formContent={
          <section className="rounded-3xl border border-black/10 bg-neutral-50/80 p-3.5 dark:border-white/10 dark:bg-neutral-900/60 sm:rounded-[1.75rem] sm:p-4">
            <div className="space-y-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{copy.nameLabel}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.namePlaceholder}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-black/20 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                />
              </label>

              <div className="rounded-2xl border border-black/10 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950 sm:p-3">
                <XFormPills
                  label={<span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.expiresInLabel}</span>}
                  value={expiresIn}
                  options={expiresInOptions}
                  onChange={(value) => setExpiresIn(value as OuterClientExpiryOption)}
                  emptyLabel={copy.expiresInEmpty}
                />
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{copy.remarkLabel}</span>
                <input
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder={copy.remarkPlaceholder}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-black/20 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <XButton
                  type="single"
                  variant="subtle"
                  button={{
                    text: copy.cancel,
                    icon: false,
                    onClick: closeCreatePanel,
                  }}
                />
                <XButton
                  type="single"
                  variant="subtle"
                  button={{
                    text: creating ? copy.creating : copy.createButton,
                    icon: <PlusIcon className="h-4 w-4" />,
                    disabled: creating || !name.trim(),
                    onClick: () => void handleCreate(),
                  }}
                />
              </div>
            </div>
          </section>
        }
        resultContent={
          <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-3.5 dark:border-amber-400/20 dark:bg-amber-500/10 sm:rounded-[1.75rem] sm:p-4">
            {!createdSecret ? (
              <div className="flex h-full min-h-48 items-center justify-center rounded-3xl border border-dashed border-amber-300/80 px-4 text-center text-sm leading-6 text-slate-600 dark:border-amber-400/25 dark:text-slate-300 sm:min-h-56 sm:px-6">
                {copy.createResultDescription}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <InfoPill label={copy.clientId} value={createdSecret.clientId} />
                  <InfoPill label={copy.environment} value={createdSecret.environment} />
                  <InfoPill label={copy.keyCount} value="1" />
                </div>

                <div className="rounded-3xl border border-black/10 bg-white/90 p-4 dark:border-white/10 dark:bg-neutral-950/85">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {copy.copyEnvBlock}
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
                          onClick: () => void copyEnvBlock(),
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-neutral-100 p-4 font-mono text-xs leading-6 text-slate-800 dark:bg-neutral-900 dark:text-slate-200 break-all whitespace-pre-wrap">
                    {envBlock}
                  </div>
                </div>
              </div>
            )}
          </section>
        }
      />
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
