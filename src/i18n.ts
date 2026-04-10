import { getRequestConfig } from 'next-intl/server';
import { appConfig } from "@/lib/appConfig";
import type { I18nConfig } from 'fumadocs-core/i18n';

export const i18n: I18nConfig = {
  defaultLanguage: appConfig.i18n.defaultLocale,
  languages: appConfig.i18n.locales as unknown as string[],
  hideLocale: appConfig.i18n.localePrefixAsNeeded ? "default-locale" : "never",
};

// Can be imported from a shared config
const locales = appConfig.i18n.locales;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  extra: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(extra)) {
    const current = result[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = deepMerge(current, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = appConfig.i18n.defaultLocale;
  }

  const baseMessages = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;
  const bizMessages = (await import(`../messages/biz/answerYou.${locale}.json`)).default as Record<string, unknown>;

  return {
    locale,
    messages: deepMerge(baseMessages, bizMessages),
  };
});
