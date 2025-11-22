#!/usr/bin/env npx tsx
/**
 * RSS Sync Script
 *
 * Imports posts from all RSS sources configured in src/config/site.ts
 * Designed to be run manually or via GitHub Actions
 *
 * Usage:
 *   npx tsx scripts/sync-rss.ts [options]
 *
 * Options:
 *   --dry-run    Preview without saving files
 *   --force      Overwrite existing files
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  importFromRSS,
  generateFrontmatter,
  extractSourceName,
} from '../src/utils/rss-import';
import { siteConfig } from '../src/config/site';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
RSS Sync Script

Imports posts from all RSS sources configured in src/config/site.ts

Usage:
  npx tsx scripts/sync-rss.ts [options]

Options:
  --dry-run    Preview without saving files
  --force      Overwrite existing files
`);
    process.exit(0);
  }

  const sources = siteConfig.rssSources;

  if (sources.length === 0) {
    console.log('No RSS sources configured in src/config/site.ts');
    console.log('\nAdd sources to siteConfig.rssSources, for example:');
    console.log(`
rssSources: [
  {
    url: 'https://myblog.com/rss.xml',
    lang: 'pl',
    author: 'pl/john-doe',
    category: 'Imported',
  },
],
`);
    process.exit(0);
  }

  console.log(`\nSyncing from ${sources.length} RSS source(s)...`);
  if (dryRun) {
    console.log('[DRY RUN - No files will be saved]\n');
  }
  if (force) {
    console.log('[FORCE - Will overwrite existing files]\n');
  }

  let totalImported = 0;
  let totalSkipped = 0;

  for (const source of sources) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Source: ${source.url}`);
    console.log(`Language: ${source.lang}`);
    console.log(`Author: ${source.author || '(from RSS)'}`);
    console.log(`Category: ${source.category || 'Imported'}`);
    console.log('='.repeat(60));

    try {
      const posts = await importFromRSS(source.url, {
        sourceName: source.sourceName || extractSourceName(source.url),
        defaultCategory: source.category,
        defaultAuthor: source.author,
        lang: source.lang,
      });

      const contentDir = join(
        process.cwd(),
        'src',
        'content',
        'blog',
        source.lang
      );

      // Ensure directory exists
      if (!dryRun && !existsSync(contentDir)) {
        mkdirSync(contentDir, { recursive: true });
      }

      for (const post of posts) {
        const filename = `${post.slug}.md`;
        const filepath = join(contentDir, filename);
        const frontmatter = generateFrontmatter(post, source.author);
        const fileContent = `${frontmatter}\n\n${post.content}`;

        console.log(`\n- ${post.title}`);
        console.log(`  Slug: ${post.slug}`);
        console.log(`  Date: ${post.pubDate.toISOString().split('T')[0]}`);

        if (dryRun) {
          console.log(`  [Would save to: ${filepath}]`);
          totalImported++;
        } else if (existsSync(filepath) && !force) {
          console.log(`  [SKIPPED - File exists: ${filename}]`);
          totalSkipped++;
        } else {
          writeFileSync(filepath, fileContent, 'utf-8');
          console.log(`  [SAVED: ${filepath}]`);
          totalImported++;
        }
      }

    } catch (error) {
      console.error(`\nError importing from ${source.url}:`, error);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Sync complete!`);
  console.log(`  Imported: ${totalImported}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log('='.repeat(60));

  if (!dryRun && totalImported > 0) {
    console.log('\nRemember to:');
    console.log('1. Review the imported posts for formatting issues');
    console.log('2. Commit and push the changes');
  }
}

main().catch(console.error);
