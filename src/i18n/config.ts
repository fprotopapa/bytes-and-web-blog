// i18n Configuration
export const languages = {
  pl: 'Polski',
  en: 'English',
} as const;

export const defaultLang = 'pl' as const;

export type Lang = keyof typeof languages;

// Routes that should not be prefixed with language
export const excludedRoutes = ['rss.xml', 'robots.txt', 'sitemap.xml'];

// Get language from URL path
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

// Get URL path without language prefix
export function getPathWithoutLang(pathname: string): string {
  const [, maybeLang, ...rest] = pathname.split('/');
  if (maybeLang in languages) {
    return '/' + rest.join('/');
  }
  return pathname;
}

// Build URL for a specific language
export function getLocalizedPath(path: string, lang: Lang): string {
  // Remove leading slash for processing
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Check if path already has a language prefix
  const [firstSegment, ...rest] = cleanPath.split('/');
  if (firstSegment in languages) {
    // Replace existing language prefix
    if (lang === defaultLang) {
      return '/' + rest.join('/') || '/';
    }
    return `/${lang}/${rest.join('/')}`;
  }

  // Add language prefix (or not for default language)
  if (lang === defaultLang) {
    return path.startsWith('/') ? path : '/' + path;
  }
  return `/${lang}${path.startsWith('/') ? path : '/' + path}`;
}
