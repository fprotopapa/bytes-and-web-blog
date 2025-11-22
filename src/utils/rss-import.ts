/**
 * RSS Import Utility
 * Fetches RSS feeds and converts them to blog post format
 */

import Parser from 'rss-parser';
import TurndownService from 'turndown';

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  creator?: string;
  categories?: string[];
  guid?: string;
}

export interface ImportedPost {
  title: string;
  description: string;
  pubDate: Date;
  canonicalUrl: string;
  externalSource: string;
  isExternal: boolean;
  originalAuthor?: string;
  tags: string[];
  category: string;
  content: string;
  slug: string;
}

export interface ImportOptions {
  sourceName: string;
  defaultCategory?: string;
  defaultAuthor?: string; // Local author reference (e.g., "pl/john-doe") - optional
  lang: 'pl' | 'en';
  maxPosts?: number;
}

/**
 * Fetch and parse an RSS feed
 */
export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  const parser = new Parser({
    customFields: {
      item: [
        ['content:encoded', 'content'],
        ['dc:creator', 'creator'],
      ],
    },
  });

  const feed = await parser.parseURL(url);

  return feed.items.map(item => ({
    title: item.title || 'Untitled',
    link: item.link || '',
    pubDate: item.pubDate || new Date().toISOString(),
    content: item.content || item['content:encoded'] || item.contentSnippet || '',
    contentSnippet: item.contentSnippet || '',
    creator: item.creator || item['dc:creator'],
    categories: item.categories,
    guid: item.guid,
  }));
}

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  // Add rule for code blocks
  turndownService.addRule('pre', {
    filter: 'pre',
    replacement: (content, node) => {
      const code = (node as HTMLElement).querySelector('code');
      const lang = code?.className?.match(/language-(\w+)/)?.[1] || '';
      return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n`;
    },
  });

  return turndownService.turndown(html);
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ąàáâãäå]/g, 'a')
    .replace(/[ćçč]/g, 'c')
    .replace(/[ęèéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[łľ]/g, 'l')
    .replace(/[ńñň]/g, 'n')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[śšş]/g, 's')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[źżž]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Extract domain name from URL for source name
 */
export function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'External';
  }
}

/**
 * Convert RSS items to blog post format
 */
export function convertToPost(
  item: RSSItem,
  options: ImportOptions
): ImportedPost {
  const content = htmlToMarkdown(item.content || item.contentSnippet);
  const description = item.contentSnippet
    ? item.contentSnippet.substring(0, 200).trim() + '...'
    : content.substring(0, 200).trim() + '...';

  // Extract tags from categories or use empty array
  const tags = item.categories?.map(cat =>
    cat.toLowerCase().replace(/\s+/g, '-')
  ) || [];

  return {
    title: item.title,
    description,
    pubDate: new Date(item.pubDate),
    canonicalUrl: item.link,
    externalSource: options.sourceName,
    isExternal: true,
    originalAuthor: item.creator,
    tags: tags.length > 0 ? tags : ['imported'],
    category: options.defaultCategory || 'Imported',
    content,
    slug: generateSlug(item.title),
  };
}

/**
 * Generate frontmatter for a blog post
 */
export function generateFrontmatter(post: ImportedPost, author?: string): string {
  const lines = ['---'];
  lines.push(`title: "${post.title.replace(/"/g, '\\"')}"`);
  lines.push(`description: "${post.description.replace(/"/g, '\\"')}"`);
  lines.push(`pubDate: ${post.pubDate.toISOString().split('T')[0]}`);
  if (author) {
    lines.push(`author: ${author}`);
  }
  lines.push(`tags: [${post.tags.map(t => `"${t}"`).join(', ')}]`);
  lines.push(`category: "${post.category}"`);
  lines.push(`draft: false`);
  lines.push(`canonicalUrl: "${post.canonicalUrl}"`);
  lines.push(`externalSource: "${post.externalSource}"`);
  lines.push(`isExternal: ${post.isExternal}`);
  if (post.originalAuthor) {
    lines.push(`originalAuthor: "${post.originalAuthor}"`);
  }
  lines.push('---');

  return lines.join('\n');
}

/**
 * Import posts from an RSS feed
 */
export async function importFromRSS(
  feedUrl: string,
  options: ImportOptions
): Promise<ImportedPost[]> {
  const items = await fetchRSSFeed(feedUrl);
  const posts = items
    .slice(0, options.maxPosts || items.length)
    .map(item => convertToPost(item, options));

  return posts;
}
