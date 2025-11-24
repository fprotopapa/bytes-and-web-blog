# Technical Documentation - Bytes & Web

This document provides detailed technical information about the Bytes & Web blog platform architecture, implementation details, and development guidelines.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Content Collections](#content-collections)
- [Internationalization (i18n)](#internationalization-i18n)
- [Routing System](#routing-system)
- [RSS Import System](#rss-import-system)
- [Site Configuration](#site-configuration)
- [Dark Mode Implementation](#dark-mode-implementation)
- [Search Implementation](#search-implementation)
- [Cookie Consent System](#cookie-consent-system)
- [Component Architecture](#component-architecture)
- [Styling System](#styling-system)
- [Build Process](#build-process)
- [Development Guidelines](#development-guidelines)

## Architecture Overview

### Technology Stack

```
Astro 5.15.9
├── Content Layer: Astro Content Collections
├── Routing: File-based with dynamic [lang] parameter
├── Styling: Tailwind CSS 4 + CSS Variables
├── Search: Pagefind (client-side)
├── i18n: Custom implementation with translation files
├── CMS: Frontmatter CMS (VS Code extension)
└── Build: Static Site Generation (SSG)
```

### Project Philosophy

1. **Content-First:** Content is the primary focus, stored in version-controlled Markdown/JSON files
2. **Type-Safe:** TypeScript and Zod schemas ensure type safety throughout
3. **Performance:** Static generation with minimal JavaScript
4. **SEO-Optimized:** Semantic HTML, meta tags, sitemaps, RSS feeds
5. **Accessible:** WCAG compliance, keyboard navigation, screen reader support
6. **Multilingual:** First-class support for multiple languages

## Content Collections

Content collections are defined in `src/content/config.ts` using Zod schemas.

### Collection Structure

All collections follow a language-first structure:

```
src/content/
├── {collection}/
│   ├── pl/          # Polish content
│   │   └── ...
│   └── en/          # English content
│       └── ...
```

### Authors Collection

**Type:** Data collection (JSON files)

**Location:** `src/content/authors/{lang}/{slug}.json`

**Schema:**
```typescript
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
```

**Usage:**
```typescript
import { getCollection } from 'astro:content';
const authors = await getCollection('authors', ({ id }) => id.startsWith('pl/'));
```

**Reference Format:** `{lang}/{slug}` (e.g., `pl/john-doe`)

### Blog Collection

**Type:** Content collection (Markdown/MDX files)

**Location:** `src/content/blog/{lang}/{slug}.md`

**Schema:**
```typescript
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('authors').optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()),
    category: z.string(),
    draft: z.boolean().default(false),
    translationId: z.string().optional(),
    // External post fields
    canonicalUrl: z.string().url().optional(),
    externalSource: z.string().optional(),
    isExternal: z.boolean().default(false),
    originalAuthor: z.string().optional(),
  }),
});
```

**Key Features:**
- **Author Reference:** Uses Astro's `reference()` for type-safe author linking
- **Translation Support:** `translationId` links equivalent content across languages
- **Draft Mode:** Posts with `draft: true` are excluded from production builds
- **External Posts:** Special fields for imported content

**Filtering Examples:**
```typescript
// Get all published posts in Polish
const posts = await getCollection('blog', ({ id, data }) =>
  id.startsWith('pl/') && !data.draft
);

// Get posts by category
const kernelPosts = await getCollection('blog', ({ data }) =>
  data.category === 'Kernel Development'
);

// Get posts with translations
const translatedPosts = await getCollection('blog', ({ data }) =>
  data.translationId !== undefined
);
```

### Courses Collection

**Type:** Data collection (JSON files)

**Location:** `src/content/courses/{lang}/{slug}.json`

**Schema:**
```typescript
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
    estimatedTime: z.string().optional(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    translationId: z.string().optional(),
  }),
});
```

**Difficulty Levels:**
- `beginner` - No prior knowledge required
- `intermediate` - Basic knowledge assumed
- `advanced` - Deep technical knowledge required

### Lessons Collection

**Type:** Content collection (Markdown/MDX files)

**Location:** `src/content/lessons/{lang}/{course-slug}/{lesson-slug}.md`

**Schema:**
```typescript
const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    course: reference('courses'),
    order: z.number(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});
```

**Lesson Organization:**
- Lessons are grouped by course slug in folder structure
- The `order` field determines lesson sequence
- Each lesson references its parent course
- Lessons inherit language from their folder structure

**Querying Lessons:**
```typescript
// Get all lessons for a course, sorted by order
const courseLessons = (await getCollection('lessons', ({ data }) =>
  data.course.id === 'pl/yocto-fundamentals' && !data.draft
)).sort((a, b) => a.data.order - b.data.order);
```

### Helper Functions

**Extract Language from ID:**
```typescript
export function getLangFromId(id: string): 'pl' | 'en' {
  const lang = id.split('/')[0];
  return lang === 'en' ? 'en' : 'pl';
}
```

**Get Slug Without Language:**
```typescript
export function getSlugWithoutLang(slug: string): string {
  const parts = slug.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : slug;
}
```

## Internationalization (i18n)

### Architecture

The i18n system is custom-built for this project with three main components:

1. **Configuration** (`src/i18n/config.ts`)
2. **Translation Strings** (`src/i18n/ui.ts`)
3. **Utility Functions** (`src/i18n/utils.ts`)

### Configuration

```typescript
// src/i18n/config.ts
export const languages = {
  pl: 'Polski',
  en: 'English',
} as const;

export const defaultLang = 'pl' as const;

export type Language = keyof typeof languages;
```

### Translation Strings

All UI text is stored in `src/i18n/ui.ts`:

```typescript
export const ui = {
  pl: {
    'nav.home': 'Strona główna',
    'nav.blog': 'Blog',
    // ... more translations
  },
  en: {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    // ... more translations
  },
} as const;

export type UIKey = keyof typeof ui.pl;
```

### Translation Function

```typescript
import { ui, type UIKey } from './ui';
import type { Language } from './config';

export function t(key: UIKey, lang: Language = 'pl'): string {
  return ui[lang][key] || ui.pl[key];
}
```

**Usage in Components:**
```astro
---
import { t } from '@/i18n/utils';
const { lang } = Astro.params;
---

<h1>{t('nav.home', lang)}</h1>
```

### Dynamic Text with Placeholders

For dynamic content, use template strings:

```typescript
// In ui.ts
'courses.lessonOf': 'Lesson {current} of {total}',

// In component
const text = t('courses.lessonOf', lang)
  .replace('{current}', String(currentLesson))
  .replace('{total}', String(totalLessons));
```

### Adding New Translations

1. Add key-value pairs to both `pl` and `en` objects in `ui.ts`
2. TypeScript will ensure type safety
3. Use the `t()` function to access translations

## Routing System

### Language-Based Routing

The site uses separate directories for Polish (default) and English content:

**Polish pages** (root level):
```
src/pages/
├── index.astro              # /
├── about.astro              # /about
├── privacy.astro            # /privacy
├── blog/
│   ├── [...page].astro      # /blog, /blog/2, etc.
│   └── [slug].astro         # /blog/{slug}
├── courses/
│   ├── index.astro          # /courses
│   ├── [slug].astro         # /courses/{slug}
│   └── [course]/
│       └── [lesson].astro   # /courses/{course}/{lesson}
├── authors/
│   └── [slug].astro         # /authors/{slug}
├── tags/
│   ├── index.astro          # /tags
│   └── [tag].astro          # /tags/{tag}
└── categories/
    ├── index.astro          # /categories
    └── [category].astro     # /categories/{category}
```

**English pages** (in `/en` subdirectory):
```
src/pages/en/
├── index.astro              # /en
├── about.astro              # /en/about
├── privacy.astro            # /en/privacy
├── blog/
│   ├── [...page].astro      # /en/blog, /en/blog/2, etc.
│   └── [slug].astro         # /en/blog/{slug}
├── courses/
│   ├── index.astro          # /en/courses
│   ├── [slug].astro         # /en/courses/{slug}
│   └── [course]/
│       └── [lesson].astro   # /en/courses/{course}/{lesson}
├── authors/
│   └── [slug].astro         # /en/authors/{slug}
├── tags/
│   ├── index.astro          # /en/tags
│   └── [tag].astro          # /en/tags/{tag}
└── categories/
    ├── index.astro          # /en/categories
    └── [category].astro     # /en/categories/{category}
```

### Static Path Generation

For dynamic routes with content, use `getStaticPaths()`:

```typescript
export const getStaticPaths = (async () => {
  const posts = await getCollection('blog', ({ id, data }) => {
    return data.draft !== true && getLangFromId(id) === 'pl'; // Filter by language
  });

  return posts.map((post) => {
    const slug = getSlugWithoutLang(post.slug);
    return {
      params: { slug },
      props: { post },
    };
  });
}) satisfies GetStaticPaths;
```

**Note:** Each language directory has its own pages that filter content by language using `getLangFromId(id) === 'pl'` or `'en'`.

### Language Detection and Redirect

Root route (`src/pages/index.astro`) redirects to default language:

```astro
---
import { defaultLang } from '@/i18n/config';
return Astro.redirect(`/${defaultLang}/`);
---
```

### Language Switcher

The language switcher detects current route and swaps language:

```typescript
// Get current path without language
const currentPath = Astro.url.pathname.replace(/^\/(pl|en)/, '');

// Generate alternate language URL
const otherLang = lang === 'pl' ? 'en' : 'pl';
const switchUrl = `/${otherLang}${currentPath}`;
```

For translated content, use `translationId` to find the equivalent page in the other language.

## RSS Import System

### Architecture

The RSS import system consists of three parts:

1. **Utility Functions** (`src/utils/rss-import.ts`)
2. **CLI Tool** (`scripts/import-rss.ts`)
3. **Sync Script** (`scripts/sync-rss.ts`)

### Utility Functions

**Parse RSS Feed:**
```typescript
export async function importFromRSS(
  feedUrl: string,
  options: ImportOptions
): Promise<ImportedPost[]> {
  // Fetch and parse RSS feed
  // Extract post data
  // Convert HTML to Markdown
  // Generate slug from title
  // Return structured post data
}
```

**Generate Frontmatter:**
```typescript
export function generateFrontmatter(
  post: ImportedPost,
  localAuthor?: string
): string {
  // Create YAML frontmatter
  // Include external post fields
  // Format dates
  // Return formatted frontmatter string
}
```

**Extract Source Name:**
```typescript
export function extractSourceName(url: string): string {
  // Extract domain from URL
  // Clean up and format
  // Return readable source name
}
```

### CLI Tool Usage

```bash
npx tsx scripts/import-rss.ts <feed-url> [options]

Options:
  --lang <pl|en>          Target language (default: pl)
  --author <author-id>    Local author reference
  --category <name>       Default category (default: Imported)
  --source <name>         Source blog name
  --max <number>          Maximum posts to import
  --dry-run               Preview without saving
```

**Example:**
```bash
npx tsx scripts/import-rss.ts https://blog.example.com/rss.xml \
  --lang pl \
  --author pl/fabbio-protopapa \
  --category "Imported" \
  --max 5 \
  --dry-run
```

### Automated Sync

Configure sources in `site.ts`:

```typescript
rssSources: [
  {
    url: 'https://myblog.com/rss.xml',
    lang: 'pl',
    author: 'pl/john-doe',
    category: 'Imported',
    sourceName: 'My Blog',
  },
]
```

Run sync:
```bash
npx tsx scripts/sync-rss.ts
```

### External Post Handling

Imported posts have special frontmatter:

```yaml
---
title: "Imported Post Title"
description: "Post description"
pubDate: 2024-11-24
tags: ["tag1", "tag2"]
category: "Category"
isExternal: true
externalSource: "Original Blog"
canonicalUrl: "https://original-blog.com/post"
originalAuthor: "Original Author Name"
draft: false
---
```

**Display Handling:**
- Show "External" badge (if `showExternalBadge: true`)
- Display source attribution
- Link to canonical URL
- Show original author if no local author assigned

## Site Configuration

### Configuration File

All site settings are centralized in `src/config/site.ts`:

```typescript
export const siteConfig = {
  // Feature toggles
  enableLanguageSwitcher: boolean,
  enablePostTranslationLinks: boolean,
  enableCourses: boolean,
  enableRss: boolean,
  enableExternalPosts: boolean,
  showExternalBadge: boolean,

  // RSS import sources
  rssSources: Array<{
    url: string;
    lang: 'pl' | 'en';
    author?: string;
    category?: string;
    sourceName?: string;
  }>,

  // Site metadata
  site: {
    url: string;
    name: string;
    defaultImage: string;
    defaultImageAlt: string;
  },

  // Social media
  social: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    reddit?: string;
    youtube?: string;
    github?: string;
    email?: string;
  },

  // Social visibility
  showSocial: {
    twitter: boolean;
    facebook: boolean;
    linkedin: boolean;
    instagram: boolean;
    reddit: boolean;
    youtube: boolean;
    github: boolean;
    email: boolean;
  },
} as const;
```

### Type Safety

Export type for use throughout the app:

```typescript
export type SiteConfig = typeof siteConfig;
```

### Usage in Components

```typescript
import { siteConfig } from '@/config/site';

// Feature checks
if (siteConfig.enableCourses) {
  // Show courses link
}

// Access social links
const githubUrl = siteConfig.social.github;
const showGithub = siteConfig.showSocial.github;
```

### Feature Toggles

**Language Switcher:**
- `enableLanguageSwitcher: true` - Show language switcher in navbar
- `enableLanguageSwitcher: false` - Hide language switcher

**Post Translation Links:**
- `enablePostTranslationLinks: true` - Show "Read in [Language]" link on posts
- `enablePostTranslationLinks: false` - Hide translation links

**Courses:**
- `enableCourses: true` - Enable courses feature and navigation
- `enableCourses: false` - Hide courses entirely

**RSS Feeds:**
- `enableRss: true` - Generate RSS feeds
- `enableRss: false` - Skip RSS generation

**External Posts:**
- `enableExternalPosts: true` - Show imported posts
- `enableExternalPosts: false` - Hide external posts
- `showExternalBadge: true` - Display "external" badge

## Dark Mode Implementation

### Architecture

Dark mode uses CSS variables with data attribute toggling:

1. **CSS Variables** - Define colors for both themes
2. **Theme Detection** - System preference detection
3. **Theme Toggle** - Button to switch themes
4. **Persistence** - localStorage to remember preference

### CSS Variables

Located in `src/styles/global.css`:

```css
:root {
  --color-primary: #22c55e;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-bg: #ffffff;
  --color-bg-alt: #f9fafb;
  --color-border: #e5e7eb;
}

[data-theme="dark"] {
  --color-primary: #22c55e;
  --color-text: #f9fafb;
  --color-text-light: #d1d5db;
  --color-bg: #111827;
  --color-bg-alt: #1f2937;
  --color-border: #374151;
}
```

### Theme Detection Script

Inline script in `<head>` prevents flash:

```javascript
(function() {
  const theme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
```

### Theme Toggle Button

```typescript
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  // Update button icon
  updateThemeIcon(newTheme);
}
```

### Using CSS Variables

In components, reference CSS variables:

```css
.my-component {
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

Or with Tailwind (configured in global.css):

```html
<div class="bg-[var(--color-bg)] text-[var(--color-text)]">
  Content
</div>
```

## Search Implementation

### Pagefind Integration

**Installation:**
```bash
npm install astro-pagefind
```

**Configuration** (`astro.config.mjs`):
```javascript
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [pagefind()],
});
```

### How It Works

1. **Build-time Indexing:** Pagefind scans HTML output during build
2. **Index Generation:** Creates search index in `dist/pagefind/`
3. **Client-side Search:** JavaScript loads index and searches locally
4. **No Backend:** Everything runs in the browser

### Search Component

Located in `src/components/Search.astro`:

```typescript
// Load Pagefind on page load
if (typeof window !== 'undefined') {
  import('/pagefind/pagefind.js').then((pagefind) => {
    pagefind.init();
  });
}
```

### Search Modal

```html
<button id="search-trigger">
  <!-- Search icon -->
</button>

<div id="search-modal" class="hidden">
  <div id="search-container"></div>
</div>

<script>
  const trigger = document.getElementById('search-trigger');
  const modal = document.getElementById('search-modal');

  trigger?.addEventListener('click', () => {
    modal?.classList.toggle('hidden');
    // Initialize Pagefind UI
  });
</script>
```

### Customizing Search

**Index Options:**
```javascript
{
  bundlePath: '/pagefind/',
  showSubResults: true,
  translations: {
    placeholder: 'Search...',
    zero_results: 'No results found',
  }
}
```

**Exclude Content:**
```html
<div data-pagefind-ignore>
  This content won't be indexed
</div>
```

## Cookie Consent System

### Architecture

The consent system consists of:

1. **ConsentBanner Component** - UI for managing consent
2. **localStorage** - Persistence layer
3. **Consent Checks** - Gate features based on consent

### Component Structure

Located in `src/components/ConsentBanner.astro`:

```typescript
interface ConsentState {
  essential: boolean;      // Always true
  preferences: boolean;    // Theme storage
  analytics: boolean;      // Future analytics
  youtube: boolean;        // YouTube embeds
}
```

### Consent Management

**Check Consent:**
```typescript
function hasConsent(category: keyof ConsentState): boolean {
  const consent = JSON.parse(
    localStorage.getItem('cookie-consent') || '{}'
  );
  return consent[category] === true;
}
```

**Update Consent:**
```typescript
function updateConsent(consent: ConsentState) {
  localStorage.setItem('cookie-consent', JSON.stringify(consent));
  window.dispatchEvent(new Event('consent-updated'));
}
```

### YouTube Component Integration

Located in `src/components/YouTube.astro`:

```typescript
// Check YouTube consent before loading video
if (hasConsent('youtube')) {
  loadVideo(videoId);
} else {
  showConsentPrompt();
}
```

### Banner Behavior

1. **First Visit:** Show banner with all options
2. **After Consent:** Hide banner, remember choices
3. **Settings Link:** Allow changing preferences anytime
4. **Essential Cookies:** Always enabled, can't be disabled

## Component Architecture

### Layout Component

`src/layouts/Layout.astro` - Main layout wrapper

**Features:**
- Meta tags and SEO
- Dark mode integration
- Navbar and footer
- Search modal
- Cookie consent banner

**Usage:**
```astro
---
import Layout from '@/layouts/Layout.astro';
---

<Layout
  title="Page Title"
  description="Page description"
  lang="pl"
>
  <!-- Page content -->
</Layout>
```

### Card Components

**PostCard** (`src/components/PostCard.astro`)
- Display blog post preview
- Show author, date, tags
- Handle external post badge
- Link to full post

**CourseCard** (`src/components/CourseCard.astro`)
- Display course preview
- Show difficulty, time estimate
- Display lesson count
- Link to course page

**AuthorCard** (`src/components/AuthorCard.astro`)
- Display author profile
- Show bio and avatar
- Link to social profiles
- Link to author page

### Component Props

Use TypeScript interfaces for props:

```typescript
interface Props {
  title: string;
  description?: string;
  lang: 'pl' | 'en';
}

const { title, description, lang = 'pl' } = Astro.props;
```

### Component Composition

Break down complex UI into smaller components:

```astro
<!-- Page -->
<Layout>
  <Hero />
  <PostGrid>
    {posts.map(post => (
      <PostCard post={post} />
    ))}
  </PostGrid>
  <Sidebar>
    <Categories />
    <Tags />
  </Sidebar>
</Layout>
```

## Styling System

### Tailwind CSS 4

**Configuration:**
```javascript
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});
```

**Global Styles** (`src/styles/global.css`):
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* CSS Variables */
/* Typography */
/* Components */
```

### CSS Architecture

1. **CSS Variables** - Theme colors and tokens
2. **Tailwind Utilities** - Component styling
3. **Custom Classes** - Complex components
4. **Typography Plugin** - Blog post styling

### Responsive Design

Mobile-first breakpoints:

```css
/* Mobile: default (< 640px) */
.class { }

/* Tablet: 640px+ */
@media (min-width: 640px) {
  .class { }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .class { }
}
```

With Tailwind:
```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- Responsive width -->
</div>
```

### Typography

**Blog Post Content:**
```html
<article class="prose prose-lg max-w-none dark:prose-invert">
  <!-- Markdown content -->
</article>
```

**Code Blocks:**
```css
pre {
  background-color: var(--color-bg-alt);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}
```

## Build Process

### Build Steps

1. **Content Collection Processing** - Parse and validate content
2. **Static Path Generation** - Create routes for all pages
3. **Component Rendering** - Render Astro components to HTML
4. **Asset Optimization** - Minify CSS/JS, optimize images
5. **Pagefind Indexing** - Generate search index
6. **Sitemap Generation** - Create sitemap.xml
7. **Output** - Write to `dist/` directory

### Build Commands

```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Build Output

```
dist/
├── index.html           # Root redirect
├── pl/                  # Polish pages
│   ├── index.html
│   ├── blog/
│   ├── courses/
│   └── ...
├── en/                  # English pages
│   ├── index.html
│   ├── blog/
│   └── ...
├── _astro/             # Optimized assets
├── pagefind/           # Search index
├── images/             # Static images
├── sitemap-index.xml   # Sitemap
└── rss/                # RSS feeds
```

### Performance Optimization

1. **Static Generation:** Pre-render all pages at build time
2. **Minimal JavaScript:** Only essential client-side code
3. **CSS Optimization:** PurgeCSS removes unused styles
4. **Image Optimization:** Use WebP format, lazy loading
5. **Code Splitting:** Separate chunks for different routes

## Development Guidelines

### File Organization

- **Components:** Reusable UI pieces in `src/components/`
- **Layouts:** Page wrappers in `src/layouts/`
- **Pages:** Routes in `src/pages/`
- **Content:** Markdown/JSON in `src/content/`
- **Utilities:** Helper functions in `src/utils/`
- **Config:** Configuration in `src/config/`
- **Styles:** Global styles in `src/styles/`

### Naming Conventions

**Files:**
- Components: `PascalCase.astro` (e.g., `PostCard.astro`)
- Pages: `kebab-case.astro` or `[param].astro`
- Content: `kebab-case.md` or `kebab-case.json`
- Utils: `kebab-case.ts`

**Variables:**
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### Code Style

**TypeScript:**
- Use explicit types for function parameters
- Use interfaces for object shapes
- Use type inference for return types when obvious
- Use const assertions for constant objects

**Astro Components:**
- Frontmatter first, then template
- Use TypeScript in frontmatter
- Extract complex logic to utilities
- Keep templates clean and readable

**CSS:**
- Prefer Tailwind utilities
- Use CSS variables for theme values
- Keep custom CSS minimal
- Use semantic class names

### Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push branch: `git push origin feature/my-feature`
4. Create pull request
5. Review and merge

### Testing

1. **Build Test:** Ensure `npm run build` succeeds
2. **Visual Test:** Check pages in dev server
3. **Link Test:** Verify internal links work
4. **Responsive Test:** Test on mobile/tablet/desktop
5. **Accessibility Test:** Check with screen reader

### Documentation

- Update README.md for user-facing changes
- Update DOCS.md for technical changes
- Update .claude/context.md for AI context
- Comment complex code with explanations
- Keep inline comments concise

---

*Last Updated: 2024-11-24*
