/**
 * RSS Import Utility
 * Fetches RSS feeds and converts them to blog post format
 */

import Parser from 'rss-parser';
import TurndownService from 'turndown';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

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
  defaultCategory?: string; // Fallback if no category in RSS
  defaultAuthor?: string; // Local author reference (e.g., "pl/john-doe") - optional
  lang: 'pl' | 'en';
  maxPosts?: number;
  downloadImages?: boolean; // Whether to download images from the source
  imageOutputDir?: string; // Directory to save images (relative to project root)
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
    content: item['content:encoded'] || item.content || item.contentSnippet || '',
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
 * Extract image URLs from markdown content
 */
export function extractImageUrls(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const urls: string[] = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * Download an image from a URL
 */
export async function downloadImage(
  imageUrl: string,
  sourceUrl: string,
  outputPath: string
): Promise<boolean> {
  try {
    // Convert relative URLs to absolute
    const absoluteUrl = imageUrl.startsWith('http')
      ? imageUrl
      : new URL(imageUrl, sourceUrl).href;

    const response = await fetch(absoluteUrl);

    if (!response.ok) {
      console.warn(`  Failed to download image: ${absoluteUrl} (${response.status})`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.warn(`  Error downloading image ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Download images from a post and update image paths
 */
export async function downloadPostImages(
  content: string,
  sourceUrl: string,
  slug: string,
  imageOutputDir: string
): Promise<{ content: string; downloadedCount: number; failedCount: number }> {
  const imageUrls = extractImageUrls(content);

  if (imageUrls.length === 0) {
    return { content, downloadedCount: 0, failedCount: 0 };
  }

  let updatedContent = content;
  let downloadedCount = 0;
  let failedCount = 0;

  for (const imageUrl of imageUrls) {
    // Extract filename from URL
    const urlPath = imageUrl.split('?')[0]; // Remove query params
    const filename = urlPath.split('/').pop() || 'image.jpg';

    // Create local path: public/images/imported/{slug}/{filename}
    const localImagePath = join('images', 'imported', slug, filename);
    const outputPath = join(process.cwd(), imageOutputDir, localImagePath);

    // Download the image
    const success = await downloadImage(imageUrl, sourceUrl, outputPath);

    if (success) {
      // Update image path in markdown (use / prefix for public folder)
      updatedContent = updatedContent.replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
        `![$1](/${localImagePath})`
      );
      downloadedCount++;
    } else {
      failedCount++;
    }
  }

  return { content: updatedContent, downloadedCount, failedCount };
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

  // Extract category from RSS (first category) or use default
  const rssCategories = item.categories || [];
  const category = rssCategories[0] || options.defaultCategory || 'Imported';

  // Use remaining categories as tags, or create from first category
  const tags = rssCategories.length > 1
    ? rssCategories.slice(1).map(cat => cat.toLowerCase().replace(/\s+/g, '-'))
    : rssCategories.length === 1
      ? [rssCategories[0].toLowerCase().replace(/\s+/g, '-')]
      : ['imported'];

  return {
    title: item.title,
    description,
    pubDate: new Date(item.pubDate),
    canonicalUrl: item.link,
    externalSource: options.sourceName,
    isExternal: true,
    originalAuthor: item.creator,
    tags,
    category,
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
