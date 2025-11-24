#!/usr/bin/env npx tsx
/**
 * RSS Import Script
 *
 * Usage:
 *   npx tsx scripts/import-rss.ts <feed-url> [options]
 *
 * Options:
 *   --lang <pl|en>          Language for imported posts (default: pl)
 *   --author <author-id>    Local author reference (default: pl/john-doe)
 *   --category <name>       Default category (default: Imported)
 *   --source <name>         Source blog name (default: extracted from URL)
 *   --max <number>          Maximum posts to import
 *   --download-images       Download images from the source and save locally
 *   --dry-run               Preview without saving files
 *
 * Examples:
 *   npx tsx scripts/import-rss.ts https://myblog.com/rss.xml --lang pl
 *   npx tsx scripts/import-rss.ts https://blog.example.com/feed --lang en --max 5 --dry-run
 *   npx tsx scripts/import-rss.ts https://blog.example.com/feed --lang en --download-images
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  importFromRSS,
  generateFrontmatter,
  extractSourceName,
  downloadPostImages,
  type ImportOptions,
} from '../src/utils/rss-import';

// Parse command line arguments
function parseArgs(args: string[]): {
  feedUrl: string;
  options: ImportOptions;
  dryRun: boolean;
  downloadImages: boolean;
} {
  const feedUrl = args[0];

  if (!feedUrl || feedUrl.startsWith('--')) {
    console.error('Error: Feed URL is required');
    console.error('Usage: npx tsx scripts/import-rss.ts <feed-url> [options]');
    process.exit(1);
  }

  let lang: 'pl' | 'en' = 'pl';
  let author: string | undefined;
  let category = 'Imported';
  let sourceName = '';
  let maxPosts: number | undefined;
  let dryRun = false;
  let downloadImages = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--lang':
        lang = args[++i] as 'pl' | 'en';
        if (!['pl', 'en'].includes(lang)) {
          console.error('Error: --lang must be "pl" or "en"');
          process.exit(1);
        }
        break;
      case '--author':
        author = args[++i];
        break;
      case '--category':
        category = args[++i];
        break;
      case '--source':
        sourceName = args[++i];
        break;
      case '--max':
        maxPosts = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--download-images':
        downloadImages = true;
        break;
      default:
        console.warn(`Warning: Unknown option ${args[i]}`);
    }
  }

  return {
    feedUrl,
    options: {
      sourceName: sourceName || extractSourceName(feedUrl),
      defaultCategory: category,
      defaultAuthor: author,
      lang,
      maxPosts,
      downloadImages,
      imageOutputDir: 'public',
    },
    dryRun,
    downloadImages,
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
RSS Import Script

Usage:
  npx tsx scripts/import-rss.ts <feed-url> [options]

Options:
  --lang <pl|en>          Language for imported posts (default: pl)
  --author <author-id>    Local author reference (default: pl/john-doe)
  --category <name>       Default category (default: Imported)
  --source <name>         Source blog name (default: extracted from URL)
  --max <number>          Maximum posts to import
  --download-images       Download images from the source and save locally
  --dry-run               Preview without saving files

Examples:
  npx tsx scripts/import-rss.ts https://myblog.com/rss.xml --lang pl
  npx tsx scripts/import-rss.ts https://blog.example.com/feed --lang en --max 5 --dry-run
  npx tsx scripts/import-rss.ts https://blog.example.com/feed --lang en --download-images
`);
    process.exit(0);
  }

  const { feedUrl, options, dryRun, downloadImages } = parseArgs(args);

  console.log(`\nImporting from: ${feedUrl}`);
  console.log(`Language: ${options.lang}`);
  console.log(`Author: ${options.defaultAuthor || '(none - will use originalAuthor from RSS)'}`);
  console.log(`Category: ${options.defaultCategory}`);
  console.log(`Source: ${options.sourceName}`);
  if (options.maxPosts) {
    console.log(`Max posts: ${options.maxPosts}`);
  }
  if (downloadImages) {
    console.log(`Download images: yes`);
  }
  if (dryRun) {
    console.log('\n[DRY RUN - No files will be saved]\n');
  }

  try {
    const posts = await importFromRSS(feedUrl, options);

    console.log(`\nFound ${posts.length} posts to import:\n`);

    const contentDir = join(
      process.cwd(),
      'src',
      'content',
      'blog',
      options.lang
    );

    // Ensure directory exists
    if (!dryRun && !existsSync(contentDir)) {
      mkdirSync(contentDir, { recursive: true });
    }

    for (const post of posts) {
      const filename = `${post.slug}.md`;
      const filepath = join(contentDir, filename);

      console.log(`- ${post.title}`);
      console.log(`  Slug: ${post.slug}`);
      console.log(`  Date: ${post.pubDate.toISOString().split('T')[0]}`);
      console.log(`  Tags: ${post.tags.join(', ')}`);
      console.log(`  Canonical: ${post.canonicalUrl}`);

      // Download images if requested
      let finalContent = post.content;
      if (downloadImages && !dryRun) {
        console.log(`  Downloading images...`);
        const result = await downloadPostImages(
          post.content,
          post.canonicalUrl,
          post.slug,
          options.imageOutputDir || 'public'
        );
        finalContent = result.content;
        if (result.downloadedCount > 0) {
          console.log(`  Downloaded ${result.downloadedCount} image(s)`);
        }
        if (result.failedCount > 0) {
          console.log(`  Failed to download ${result.failedCount} image(s)`);
        }
      }

      const frontmatter = generateFrontmatter(post, options.defaultAuthor);
      const fileContent = `${frontmatter}\n\n${finalContent}`;

      if (dryRun) {
        console.log(`  [Would save to: ${filepath}]\n`);
      } else {
        if (existsSync(filepath)) {
          console.log(`  [SKIPPED - File already exists: ${filename}]\n`);
        } else {
          writeFileSync(filepath, fileContent, 'utf-8');
          console.log(`  [Saved to: ${filepath}]\n`);
        }
      }
    }

    console.log(`\nImport complete! ${posts.length} posts processed.`);

    if (!dryRun) {
      console.log(`\nFiles saved to: ${contentDir}`);
      console.log('\nRemember to:');
      console.log('1. Review the imported posts for formatting issues');
      console.log('2. Update author references if needed');
      console.log('3. Adjust categories and tags as appropriate');
    }

  } catch (error) {
    console.error('\nError importing RSS feed:', error);
    process.exit(1);
  }
}

main();
