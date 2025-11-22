import rss from '@astrojs/rss';
import { getCollection, getEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { getLangFromId, getSlugWithoutLang } from '../../content/config';
import { siteConfig } from '../../config/site';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  // Check if RSS is enabled
  if (!siteConfig.enableRss) {
    return new Response(null, { status: 404 });
  }

  // English RSS feed
  // Filter out MDX files as they contain JSX that won't render properly
  const posts = await getCollection('blog', ({ id, data }) => {
    return data.draft !== true && getLangFromId(id) === 'en' && !id.endsWith('.mdx');
  });

  const sortedPosts = posts.sort((a, b) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const siteUrl = (context.site?.toString() || siteConfig.site.url).replace(/\/$/, '');

  return rss({
    title: 'Embedded Linux Blog',
    description: 'A blog about embedded Linux, kernel development, build systems, and more',
    site: siteUrl,
    items: await Promise.all(sortedPosts.map(async (post) => {
      const postUrl = `${siteUrl}/en/blog/${getSlugWithoutLang(post.slug)}`;
      // Use canonical URL if it's an external post, otherwise use local URL
      const canonicalUrl = post.data.canonicalUrl || postUrl;

      // Render markdown content to HTML
      const content = sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      });

      // Get author name
      const author = await getEntry(post.data.author);
      const authorName = post.data.originalAuthor || author?.data.name || undefined;

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: postUrl,
        categories: [post.data.category, ...post.data.tags],
        author: authorName,
        content,
        customData: `<guid isPermaLink="true">${canonicalUrl}</guid>`,
      };
    })),
    customData: '<language>en-us</language>',
  });
}
