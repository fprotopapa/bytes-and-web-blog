import { ui, type UIKey } from './ui';
import { defaultLang, type Lang } from './config';

// Get translation for a key
export function t(lang: Lang, key: UIKey): string {
  return ui[lang][key] || ui[defaultLang][key] || key;
}

// Create a translation function for a specific language
export function useTranslations(lang: Lang) {
  return function translate(key: UIKey): string {
    return t(lang, key);
  };
}

// Format date according to locale
export function formatDate(date: Date, lang: Lang): string {
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get plural form for post count
export function getPostCountText(count: number, lang: Lang): string {
  if (lang === 'pl') {
    // Polish has complex plural rules
    if (count === 1) return '1 wpis';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return `${count} wpisy`;
    }
    return `${count} wpisów`;
  }
  // English
  return count === 1 ? '1 post' : `${count} posts`;
}

// Get the alternate language
export function getAlternateLang(lang: Lang): Lang {
  return lang === 'pl' ? 'en' : 'pl';
}
