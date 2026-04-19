import { getTranslations } from 'next-intl/server'
import { BookOpenIcon } from '@windrun-huaiin/base-ui/icons'
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { GradientButton } from "@windrun-huaiin/third-ui/fuma/mdx"
import { HeroMedia, HeroSection } from "@windrun-huaiin/third-ui/main";
import { themeHeroEyesOnClass } from '@windrun-huaiin/base-ui/lib'
import { cn } from '@windrun-huaiin/lib/utils';

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });
  const viewQuestionsListHref = getAsNeededLocalizedUrl(locale, '/questions');

  return (
    <HeroSection
      content={
        <>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {t('mainTitle')}<br />{" "}
            <span className={cn("bg-clip-text text-transparent", themeHeroEyesOnClass)}>{t('mainEyesOn')}</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            {t('description')}
          </p>
          <GradientButton
            title={t('button')}
            href={viewQuestionsListHref}
            openInNewTab={false}
            align="center"
            className="md:w-full"
          />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <BookOpenIcon className="h-4 w-4" />
            <span>{t('about')}</span>
          </div>
        </>
      }
      media={
        <HeroMedia
          src={t('heroImageUrl')}
          alt={t('heroImageAlt')}
          width={2824}
          height={1804}
        />
      }
    />
  )
}
