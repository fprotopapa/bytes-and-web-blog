# Bytes & Web - Astro Blog Project Context

## Project Overview
Multilingual technical blog platform focused on embedded Linux, software development, and IT topics. Built with Astro, featuring multi-author support, structured courses, and comprehensive i18n capabilities.

**Site:** https://bytesandweb.pl
**Default Language:** Polish (pl)
**Supported Languages:** Polish (pl), English (en)

**Tech Stack:**
- Astro 5.15.9 (Static Site Generator)
- Tailwind CSS 4.1.17 (Utility-first styling)
- @tailwindcss/typography (Blog post typography)
- Pagefind (Client-side full-text search)
- Frontmatter CMS (VS Code content management)
- TypeScript (Type safety)
- MDX (Enhanced Markdown with components)
- GitHub Actions (CI/CD with rsync deployment)

**Live Development:**
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Project Structure

```
/home/fabbio/devel/astro/blog/
├── .astro/                 # Build artifacts, schemas
├── .github/workflows/      # GitHub Actions CI/CD
├── public/                 # Static assets
│   └── images/            # Images (WebP format)
├── src/
│   ├── components/
│   │   ├── PostCard.astro          # Blog post preview
│   │   ├── CourseCard.astro        # Course preview
│   │   ├── AuthorCard.astro        # Author profile
│   │   ├── YouTube.astro           # YouTube embed with consent
│   │   ├── Search.astro            # Pagefind search
│   │   ├── LanguageSwitcher.astro  # Language toggle
│   │   ├── Breadcrumbs.astro       # Navigation breadcrumbs
│   │   ├── ConsentBanner.astro     # Cookie consent
│   │   ├── LessonNav.astro         # Course lesson navigation
│   │   └── SchemaOrg.astro         # SEO structured data
│   ├── content/
│   │   ├── config.ts              # Content schemas (Zod)
│   │   ├── blog/                  # Blog posts (pl/, en/)
│   │   ├── authors/               # Author profiles (pl/, en/)
│   │   ├── courses/               # Course definitions (pl/, en/)
│   │   └── lessons/               # Course lessons (pl/course/, en/course/)
│   ├── i18n/
│   │   ├── config.ts              # Language routing config
│   │   └── ui.ts                  # UI translations (100+ keys)
│   ├── layouts/
│   │   └── Layout.astro           # Main layout with navbar, footer
│   ├── pages/
│   │   ├── index.astro            # Home page
│   │   ├── blog/                  # Blog routes
│   │   ├── authors/               # Author pages
│   │   ├── categories/            # Category browsing
│   │   ├── tags/                  # Tag pages
│   │   ├── courses/               # Course pages
│   │   ├── en/                    # English versions of all routes
│   │   ├── rss.xml.ts             # RSS feed
│   │   └── privacy.astro          # Privacy policy
│   ├── config/
│   │   └── site.ts                # Site configuration
│   ├── utils/                     # Helper functions
│   │   └── rss-import.ts          # RSS import utilities
│   └── styles/
│       └── global.css             # Global styles, CSS variables
├── scripts/
│   ├── import-rss.ts              # RSS import CLI tool
│   └── sync-rss.ts                # Automated RSS sync
├── astro.config.mjs               # Main Astro configuration
├── frontmatter.json               # Frontmatter CMS config
├── package.json
└── tsconfig.json
```

## Content Collections

### 1. Authors Collection
**Type:** Data (JSON)
**Location:** `src/content/authors/{lang}/{slug}.json`

**Schema:**
```typescript
{
  name: string
  bio: string
  avatar: string
  email?: string
  github?: string
  linkedin?: string
  website?: string
}
```

**Reference Format:** `{lang}/{slug}` (e.g., `pl/fabbio-protopapa`)

### 2. Blog Collection
**Type:** Content (Markdown/MDX)
**Location:** `src/content/blog/{lang}/{slug}.md`

**Schema:**
```typescript
{
  title: string
  description: string
  pubDate: Date
  updatedDate?: Date
  author: reference('authors')
  coverImage?: string
  tags: string[]
  category: string
  draft: boolean
  translationId?: string        // Links equivalent content across languages
  // External post fields
  canonicalUrl?: string
  externalSource?: string
  isExternal: boolean
  originalAuthor?: string
}
```

**Key Features:**
- Type-safe author references
- Draft mode for unpublished posts
- Translation linking via `translationId`
- External post support for RSS imports

### 3. Courses Collection
**Type:** Data (JSON)
**Location:** `src/content/courses/{lang}/{slug}.json`

**Schema:**
```typescript
{
  title: string
  description: string
  coverImage?: string
  author: reference('authors')
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: string
  pubDate: Date
  draft: boolean
  translationId?: string
}
```

**Current Example:** Yocto Fundamentals course

### 4. Lessons Collection
**Type:** Content (Markdown/MDX)
**Location:** `src/content/lessons/{lang}/{course-slug}/{lesson-slug}.md`

**Schema:**
```typescript
{
  title: string
  description: string
  course: reference('courses')
  order: number                 // Determines lesson sequence
  pubDate: Date
  updatedDate?: Date
  draft: boolean
}
```

**Organization:**
- Lessons grouped by course slug in folder structure
- `order` field determines sequence
- Each lesson references parent course
- Navigation handled by LessonNav component

## Internationalization (i18n)

### Architecture
**Default Language:** Polish (no URL prefix)
**Secondary Languages:** English (prefixed with `/en`)

**URL Structure:**
- Polish: `/blog`, `/categories`, `/tags`, `/courses`
- English: `/en/blog`, `/en/categories`, `/en/tags`, `/en/courses`

### Translation System
**Configuration:** `src/i18n/config.ts`
```typescript
export const languages = { pl: 'Polski', en: 'English' } as const;
export const defaultLang = 'pl' as const;
```

**Translation Strings:** `src/i18n/ui.ts` (100+ keys)
```typescript
export const ui = {
  pl: { 'nav.home': 'Strona główna', ... },
  en: { 'nav.home': 'Home', ... }
} as const;
```

**Translation Function:**
```typescript
import { t } from '@/i18n/utils';
const text = t('nav.home', lang);
```

### Content Organization
All content collections use language-prefixed structure:
```
src/content/{collection}/
├── pl/           # Polish content
└── en/           # English content
```

### Language Switching
- `LanguageSwitcher.astro` component in navbar
- Detects current route and swaps language prefix
- Uses `translationId` to find equivalent content
- Falls back to home page if translation unavailable

## Key Features

### Content Management
- Multi-author blogging with author profiles
- Structured course/lesson system
- Draft mode for unpublished content
- External post imports via RSS
- Translation linking across languages
- Category and tag organization

### User Experience
- Full-text client-side search (Pagefind)
- Dark/light mode with system preference detection
- Responsive design (mobile-first)
- Breadcrumb navigation
- Language switcher
- Cookie consent management
- YouTube embeds with consent control

### Developer Experience
- TypeScript throughout
- Zod schema validation
- File-based routing
- Content management via Frontmatter CMS
- Hot module replacement in dev
- Static site generation (SSG)
- GitHub Actions CI/CD

### SEO & Performance
- Semantic HTML
- Schema.org structured data (SchemaOrg component)
- Sitemap generation with i18n support
- RSS feed generation
- Meta tags and OpenGraph
- Static pre-rendering
- Minimal JavaScript
- WebP image format
- Code splitting

## RSS Import System

### Architecture
**Utility Functions:** `src/utils/rss-import.ts`
- Parse RSS feeds
- Convert HTML to Markdown
- Generate frontmatter
- Extract source information

**CLI Tool:** `scripts/import-rss.ts`
```bash
npx tsx scripts/import-rss.ts <feed-url> [options]
  --lang <pl|en>          Target language
  --author <author-id>    Local author reference
  --category <name>       Default category
  --source <name>         Source blog name
  --max <number>          Maximum posts to import
  --dry-run               Preview without saving
```

**Automated Sync:** `scripts/sync-rss.ts`
- Configure sources in `src/config/site.ts`
- Automatic periodic imports

**External Post Handling:**
- `isExternal: true` flag
- Shows source attribution
- Links to canonical URL
- Displays original author

## Site Configuration

**Location:** `src/config/site.ts`

**Feature Toggles:**
```typescript
{
  enableLanguageSwitcher: boolean
  enablePostTranslationLinks: boolean
  enableCourses: boolean
  enableRss: boolean
  enableExternalPosts: boolean
  showExternalBadge: boolean
}
```

**Site Metadata:**
```typescript
{
  site: {
    url: 'https://bytesandweb.pl'
    name: 'Bytes & Web'
    defaultImage: string
    defaultImageAlt: string
  }
}
```

**Social Links:**
```typescript
{
  social: { twitter, facebook, linkedin, instagram, reddit, youtube, github, email }
  showSocial: { [key]: boolean }  // Control visibility
}
```

**RSS Sources:**
```typescript
rssSources: [{
  url: string
  lang: 'pl' | 'en'
  author?: string
  category?: string
  sourceName?: string
}]
```

## Dark Mode Implementation

### System
- CSS variables for all theme colors
- `data-theme` attribute on `<html>` element
- localStorage for preference persistence
- System preference detection
- Inline script prevents flash on load

### Variables (src/styles/global.css)
```css
:root {
  --color-primary: #22c55e
  --color-text: #1f2937
  --color-bg: #ffffff
  /* ... more variables */
}

[data-theme="dark"] {
  --color-primary: #22c55e
  --color-text: #f9fafb
  --color-bg: #111827
  /* ... more variables */
}
```

### Toggle
- Sun/moon icon in navbar (desktop and mobile)
- Smooth transitions on theme change
- Updates all components using CSS variables

## Cookie Consent System

### ConsentBanner Component
**Categories:**
- `essential` - Always enabled
- `preferences` - Theme storage
- `analytics` - Future analytics integration
- `youtube` - YouTube embed consent

**Storage:** localStorage (`cookie-consent`)

**Integration:**
- YouTube component checks consent before loading
- ConsentBanner appears on first visit
- Settings accessible via privacy page
- Event-based updates (`consent-updated`)

## Search Implementation

### Pagefind
**Type:** Client-side full-text search

**Features:**
- Build-time indexing (automatic)
- No backend required
- Searches all HTML output
- Modal UI in navbar
- Supports multiple languages

**Configuration:** `astro.config.mjs`
```javascript
import pagefind from 'astro-pagefind';
export default defineConfig({
  integrations: [pagefind()]
});
```

**Component:** `src/components/Search.astro`
- Dynamic Pagefind UI loading
- Modal interface
- Keyboard shortcuts support

## Styling System

### Tailwind CSS 4
**Configuration:**
```javascript
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  vite: { plugins: [tailwindcss()] }
});
```

**Global Styles:** `src/styles/global.css`
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### Responsive Design
Mobile-first breakpoints:
- Default: < 640px
- sm: 640px+
- md: 768px+
- lg: 1024px+
- xl: 1280px+

### Typography
**Blog Posts:**
```html
<article class="prose prose-lg max-w-none dark:prose-invert">
```

**Syntax Highlighting:**
- Shiki with GitHub Dark theme
- Line numbers enabled
- Code wrapping enabled

## Build Process

### Commands
```bash
npm run dev       # Development server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

### Build Steps
1. Content collection processing (Zod validation)
2. Static path generation
3. Component rendering to HTML
4. Asset optimization (CSS/JS minification)
5. Pagefind search index generation
6. Sitemap generation
7. Output to `dist/`

### Output Structure
```
dist/
├── index.html           # Root redirect to default language
├── blog/                # Polish blog pages
├── courses/             # Polish course pages
├── en/                  # English pages
│   ├── blog/
│   └── courses/
├── _astro/              # Optimized assets
├── pagefind/            # Search index
└── sitemap-index.xml    # Sitemap
```

## Deployment

### GitHub Actions
**Workflow:** `.github/workflows/deploy.yml`
- Trigger: Push to main branch
- Build: `npm run build`
- Deploy: rsync to web server
- SSH-based deployment
- Secrets: SSH keys, server credentials

### Manual Deployment
```bash
npm run build
rsync -avz dist/ user@server:/path/to/webroot/
```

## Content Focus Areas

**Categories:**
1. Software - Applications, systems, programming
2. Development Tools - IDEs, CI/CD, Git, containers
3. Cloud & Servers - Server management, virtualization
4. Hardware & Integration - IoT, embedded systems

**Topics:**
- Embedded Linux (Yocto, Buildroot)
- Kernel Development
- Bootloaders (U-Boot)
- Device Trees
- Build Systems

**Target Audience:**
- Embedded systems developers
- Linux kernel engineers
- DevOps professionals
- IT enthusiasts and learners

## Current Content

**Authors:**
- Fabbio Protopapa (primary)
- Alex Chen (bootloader specialist)
- Jane Smith (Yocto specialist)

**Courses:**
- Yocto Fundamentals (3 lessons)

**Blog Posts:**
- U-Boot fundamentals
- Video tutorials
- Test posts (drafts)

## Development Workflow

### Creating Content

**Blog Post:**
```bash
# Create: src/content/blog/pl/my-post.md
# Use Frontmatter CMS or manual editing
# Include all required frontmatter fields
```

**Course:**
```bash
# Create: src/content/courses/pl/my-course.json
# Create lessons: src/content/lessons/pl/my-course/*.md
# Set order field for lesson sequence
```

**Author:**
```bash
# Create: src/content/authors/pl/author-name.json
# Follow authors schema
```

### Using Frontmatter CMS
1. Open VS Code
2. Install Frontmatter CMS extension
3. Click Frontmatter icon
4. Manage content visually
5. Configuration in `frontmatter.json`

## Helper Functions

**Language Utilities:**
```typescript
// Extract language from content ID
getLangFromId(id: string): 'pl' | 'en'

// Remove language prefix from slug
getSlugWithoutLang(slug: string): string
```

**Translation Utilities:**
```typescript
// Get translated string
t(key: UIKey, lang: Language): string

// Example
const homeText = t('nav.home', 'pl'); // "Strona główna"
```

## Known Issues & Notes

1. **Image Optimization:** Using WebP format for performance
2. **EXIF Data:** Fixed EXIF orientation issues
3. **Port Conflicts:** Dev server may use alternate ports
4. **Language Fallbacks:** Falls back to home if translation missing

## Astro Configuration

**Site URL:** https://bytesandweb.pl
**Default Locale:** pl
**Supported Locales:** pl, en
**Routing:** Default locale prefix disabled (Polish has no prefix)

**Markdown:**
- Theme: GitHub Dark
- Syntax highlighting: Shiki
- Line numbers: Enabled
- Code wrapping: Enabled

**Integrations:**
- MDX support
- Sitemap generation
- Pagefind search
- Tailwind CSS 4

## File Naming Conventions

**Components:** PascalCase.astro (e.g., `PostCard.astro`)
**Pages:** kebab-case.astro or `[param].astro`
**Content:** kebab-case.md or kebab-case.json
**Utils:** kebab-case.ts
**Variables:** camelCase
**Types:** PascalCase

## Project Status
✅ Multilingual support (Polish/English)
✅ Multi-author platform
✅ Course/lesson system
✅ RSS import capabilities
✅ Dark mode implementation
✅ Search functionality
✅ Cookie consent system
✅ SEO optimization
✅ Responsive design
✅ CI/CD pipeline
✅ Production ready

## Future Enhancements

**Potential Improvements:**
- Reading time estimation
- Code copy buttons
- Social sharing buttons
- Comments system (giscus)
- Analytics integration
- Search filters by category/tag
- Newsletter integration
- Progressive Web App (PWA)

---

*Last Updated: 2024-11-24*
*Context for Claude Code session continuity*
