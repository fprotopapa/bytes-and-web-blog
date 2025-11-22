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

// Get translations of a post by translationId
import type { CollectionEntry } from 'astro:content';
import { getLangFromId, getSlugWithoutLang } from '../content/config';

export interface PostTranslation {
  lang: Lang;
  slug: string;
  title: string;
}

export function getPostTranslations(
  currentPost: CollectionEntry<'blog'>,
  allPosts: CollectionEntry<'blog'>[]
): PostTranslation[] {
  const translationId = currentPost.data.translationId;

  if (!translationId) {
    return [];
  }

  return allPosts
    .filter(post =>
      post.data.translationId === translationId &&
      post.id !== currentPost.id &&
      post.data.draft !== true
    )
    .map(post => ({
      lang: getLangFromId(post.id) as Lang,
      slug: getSlugWithoutLang(post.slug),
      title: post.data.title,
    }));
}
