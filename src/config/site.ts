// Site configuration
// Control various features of the blog

export const siteConfig = {
  // Enable or disable the language switcher in navigation
  enableLanguageSwitcher: true,

  // Enable or disable language switcher on blog posts (for translations)
  enablePostTranslationLinks: true,

  // Enable or disable courses feature
  enableCourses: true,

  // Enable or disable RSS feeds
  enableRss: true,

  // Enable external/imported posts features
  enableExternalPosts: true,

  // Show "external" badge on imported posts
  showExternalBadge: true,

  // RSS sync sources for importing external blog posts
  // Used by the RSS import script and GitHub Actions
  rssSources: [
    // Example configuration:
    // {
    //   url: 'https://myblog.com/rss.xml',
    //   lang: 'pl',
    //   author: 'pl/john-doe', // optional - if omitted, uses originalAuthor from RSS
    //   category: 'Imported', // optional fallback - categories from RSS are used first
    //   sourceName: 'My Blog', // optional - extracted from URL if omitted
    // },
  ] as Array<{
    url: string;
    lang: 'pl' | 'en';
    author?: string;
    category?: string; // Fallback category if not in RSS
    sourceName?: string;
  }>,

  // Site metadata
  site: {
    url: 'https://example.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
