// Site configuration
// Control various features of the blog

export const siteConfig = {
  // Enable or disable the language switcher in navigation
  enableLanguageSwitcher: true,

  // Enable or disable language switcher on blog posts (for translations)
  enablePostTranslationLinks: true,

  // Site metadata
  site: {
    url: 'https://example.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
