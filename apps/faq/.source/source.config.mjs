// src/lib/appConfig.ts
import { createCommonAppConfig, createI18nHelpers, LOCALE_PRESETS } from "@windrun-huaiin/lib/common-app-config";
var appConfig = {
  ...createCommonAppConfig(LOCALE_PRESETS.EN_ONLY),
  creditsConfig: {
    freeAmount: 1,
    freeRegisterAmount: 2,
    freeExpiredDays: 7,
    oneTimeExpiredDays: 30
  }
};
var { isSupportedLocale, getValidLocale, generatedLocales } = createI18nHelpers(appConfig.i18n);
var { localePrefixAsNeeded, defaultLocale } = appConfig.i18n;
var { iconColor, watermark, showBanner, clerkPageBanner, clerkAuthInModal, placeHolderImage } = appConfig.shortcuts;
var { freeAmount, freeRegisterAmount, freeExpiredDays, oneTimeExpiredDays } = appConfig.creditsConfig;

// source.config.ts
import { createCommonDocsSchema, createCommonMetaSchema } from "@windrun-huaiin/third-ui/lib/server";
import { rehypeCodeDefaultOptions, remarkSteps } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
var mdxSourceDir = appConfig.mdxSourceDir;
var blog = defineDocs({
  dir: mdxSourceDir.blog,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: createCommonDocsSchema()
  },
  meta: {
    schema: createCommonMetaSchema()
  }
});
var legal = defineDocs({
  dir: mdxSourceDir.legal,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: createCommonDocsSchema()
  },
  meta: {
    schema: createCommonMetaSchema()
  }
});
var source_config_default = defineConfig({
  lastModifiedTime: "git",
  mdxOptions: {
    providerImportSource: "@/components/mdx-components",
    // disable remark-image default behavior, use remote URL for all images
    remarkImageOptions: false,
    rehypeCodeOptions: {
      lazy: true,
      inline: "tailing-curly-colon",
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
      },
      transformers: [
        // 1. custom transformer, add data-language from this.options.lang
        {
          name: "transformer:parse-code-language",
          pre(preNode) {
            const languageFromOptions = this.options?.lang;
            if (languageFromOptions && typeof languageFromOptions === "string" && languageFromOptions.trim() !== "") {
              if (!preNode.properties) {
                preNode.properties = {};
              }
              const langLower = languageFromOptions.toLowerCase();
              preNode.properties["data-language"] = langLower;
            }
            return preNode;
          }
        },
        // 2. Fumadocs default transformers
        ...rehypeCodeDefaultOptions.transformers ?? [],
        // 3. your existing transformer
        {
          name: "transformers:remove-notation-escape",
          code(hast) {
            for (const line of hast.children) {
              if (line.type !== "element") continue;
              const lastSpan = line.children.findLast(
                (v) => v.type === "element"
              );
              const head = lastSpan?.children[0];
              if (head?.type !== "text") continue;
              head.value = head.value.replace(/\[\\!code/g, "[!code");
            }
          }
        }
      ]
    },
    remarkPlugins: [
      remarkSteps,
      remarkMath
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v]
  }
});
export {
  blog,
  source_config_default as default,
  legal
};
