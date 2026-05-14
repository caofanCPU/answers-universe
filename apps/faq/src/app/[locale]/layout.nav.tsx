import Preview from '@/../public/banner.webp';
import { defaultLocale, localePrefixAsNeeded } from '@/lib/appConfig';
import {
  LibraryIcon, JsonIcon, PencilIcon, BrainCircuitIcon } from '@windrun-huaiin/base-ui/icons';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import {
  createLocalizedNavContext,
  createLocalizedNavGroup,
  createLocalizedNavLink,
} from '@windrun-huaiin/third-ui/fuma/base/nav-config';
import {
  type SiteMenuGroupConfig,
  type SiteMenuLeafConfig,
  type SiteNavItemConfig,
} from '@windrun-huaiin/third-ui/fuma/base/site-layout-shared';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

function renderMenuBanner() {
  return (
    <div className="-mx-3 -mt-3">
      <Image
        src={Preview}
        alt="Preview"
        className="rounded-t-lg object-cover"
        style={{
          maskImage: 'linear-gradient(to bottom,white 60%,transparent)',
        }}
      />
    </div>
  );
}

function createNavContext(locale: string) {
  return createLocalizedNavContext({
    locale,
    localePrefixAsNeeded,
    defaultLocale,
    localizeHref: getAsNeededLocalizedUrl,
  });
}

export async function primaryNavLinks(locale: string): Promise<SiteNavItemConfig[]> {
  const t1 = await getTranslations({ locale, namespace: 'linkPreview' });
  const context = createNavContext(locale);

  return [
    createLocalizedNavLink(
      {
        text: t1('pricing'),
        path: '/pricing',
        prefetch: false,
      },
      context,
    ),
    createLocalizedNavLink(
      {
        text: t1('blog'),
        path: '/blog',
        prefetch: false,
      },
      context,
    ),
    createLocalizedNavLink(
      {
        text: t1('test'),
        path: '/test',
        prefetch: false,
      },
      context,
    ),
  ];
}

export async function levelNavLinks(locale: string): Promise<SiteNavItemConfig[]> {
  const t2 = await getTranslations({ locale, namespace: 'linkPreview' });
  const context = createNavContext(locale);

  const libraryLinks: SiteMenuLeafConfig[] = [
    {
      text: 'Question Library',
      description: 'Query filters with DB',
      path: '/questions',
      prefetch: false,
      icon: <LibraryIcon />,
      className: 'lg:col-start-2 lg:row-start-1',
    },
    {
      text: 'Random Mode',
      description: 'Query and plan questions with random',
      path: '/questions/random',
      prefetch: false,
      icon: <BrainCircuitIcon />,
      className: 'lg:col-start-3 lg:row-start-2',
    },
    {
      text: 'Manage Client',
      description: 'Questions Auth clients',
      path: '/questions/clients',
      prefetch: false,
      icon: <PencilIcon />,
      className: 'lg:col-start-2 lg:row-start-2',
    },
    {
      text: 'Import Question',
      description: 'Batching create questions',
      path: '/questions/import',
      prefetch: false,
      icon: <JsonIcon />,
      className: 'lg:col-start-3 lg:row-start-1',
    },
  ];
  
  const levelMenus: SiteMenuGroupConfig[] = [
    {
      text: t2('library'),
      path: '/questions',
      prefetch: false,
      landing: {
        text: 'I ❤️ Trivia',
        description: "The universe's question AI can answer YOU.",
        path: '/questions/random',
        prefetch: false,
      },
      items: libraryLinks,
    },
  ];

  return levelMenus.map((item) =>
    createLocalizedNavGroup(
      {
        ...item,
        text: item.text as string,
      },
      context,
      {
        featuredBanner: renderMenuBanner(),
      },
    ),
  );
}
