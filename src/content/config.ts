import { defineCollection, reference, z } from 'astro:content';

// Authors collection - nested by language (pl/, en/)
const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    email: z.string().email().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
  }),
});

// Blog collection - nested by language (pl/, en/)
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('authors'),
    coverImage: z.string().optional(),
    tags: z.array(z.string()),
    category: z.string(),
    draft: z.boolean().default(false),
    translationId: z.string().optional(), // Links translations of the same post
  }),
});

// Courses collection - nested by language (pl/, en/)
const courses = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverImage: z.string().optional(),
    author: reference('authors'),
    category: z.string(),
    tags: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedTime: z.string().optional(), // e.g., "4 hours", "2 weeks"
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    translationId: z.string().optional(), // Links translations of the same course
  }),
});

// Lessons collection - nested by language and course (pl/course-slug/, en/course-slug/)
const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    course: reference('courses'),
    order: z.number(), // Lesson order within course (1, 2, 3...)
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { authors, blog, courses, lessons };

// Helper to extract language from content id (e.g., "pl/my-post" -> "pl")
export function getLangFromId(id: string): 'pl' | 'en' {
  const lang = id.split('/')[0];
  return lang === 'en' ? 'en' : 'pl';
}

// Helper to get slug without language prefix (e.g., "pl/my-post" -> "my-post")
export function getSlugWithoutLang(slug: string): string {
  const parts = slug.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : slug;
}
