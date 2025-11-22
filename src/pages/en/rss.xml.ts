import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { getLangFromId, getSlugWithoutLang } from '../../content/config';

export async function GET(context: APIContext) {
  // English RSS feed
  const posts = await getCollection('blog', ({ id, data }) => {
    return data.draft !== true && getLangFromId(id) === 'en';
  });

  const sortedPosts = posts.sort((a, b) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'Embedded Linux Blog',
    description: 'A blog about embedded Linux, kernel development, build systems, and more',
    site: context.site || 'https://example.com',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/en/blog/${getSlugWithoutLang(post.slug)}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
}
