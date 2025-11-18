# Astro Blog Project Context

## Project Overview
Static blog site about embedded Linux topics with multiple collaborators, built with Astro.

**Tech Stack:**
- Astro 5.15.9 (Static Site Generator)
- Tailwind CSS 4 (Styling, mobile-first)
- @tailwindcss/typography (Blog post typography)
- Pagefind (Search functionality)
- Frontmatter CMS (Content management via VS Code)
- TypeScript (Type safety)
- MDX (Content format)

**Live Development:**
- Dev server: `npm run dev` (currently on port 4322)
- Build: `npm run build` (27 pages)
- Preview: `npm run preview`

## Project Structure

```
/home/fabbio/devel/astro/blog/
├── src/
│   ├── content/
│   │   ├── blog/           # Blog posts (.md files)
│   │   └── authors/        # Author profiles (.json files)
│   ├── layouts/
│   │   └── Layout.astro    # Main layout with navbar, dark mode toggle, footer
│   ├── pages/
│   │   ├── index.astro     # Home page (5 newest posts)
│   │   ├── blog/
│   │   │   ├── index.astro # All posts page
│   │   │   └── [slug].astro # Single post page
│   │   ├── authors/[slug].astro
│   │   ├── tags/
│   │   ├── categories/
│   │   └── rss.xml.ts
│   ├── components/
│   │   ├── PostCard.astro  # Post preview component
│   │   ├── AuthorCard.astro # Author info component
│   │   └── Search.astro    # Pagefind search component
│   └── styles/
│       └── global.css      # Global styles, CSS variables, dark mode
├── astro.config.mjs
├── frontmatter.json        # Frontmatter CMS config
└── package.json
```

## Content Collections Schema

**Authors** (`src/content/authors/`)
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

**Blog Posts** (`src/content/blog/`)
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
}
```

## Current Sample Content

**Authors:**
1. John Doe (john-doe.json) - Kernel developer
2. Jane Smith (jane-smith.json) - Yocto specialist
3. Alex Chen (alex-chen.json) - Bootloader specialist

**Blog Posts:**
1. introduction-to-yocto.md
2. linux-kernel-modules.md
3. u-boot-basics.md
4. device-tree-guide.md
5. buildroot-vs-yocto.md

## Features Implemented

### Phase 1: Initial Setup (Completed)
- ✅ Astro project initialization
- ✅ Content collections for authors and blog posts
- ✅ Sample content (3 authors, 5 blog posts)
- ✅ Layout with navbar and footer
- ✅ PostCard and AuthorCard components
- ✅ All required pages (home, blog, tags, categories, authors)
- ✅ RSS feed integration

### Phase 2: Enhancements (Completed)
- ✅ Tailwind CSS 4 migration (mobile-first)
- ✅ Pagefind search integration
- ✅ Frontmatter CMS configuration
- ✅ Search component in navbar

### Phase 3: Bug Fixes (Completed)
- ✅ Dark mode with theme toggle
- ✅ Blog post prose styling fixes
- ✅ Mobile layout fixes (sidebar collision)

## Dark Mode Implementation

**CSS Variables** (`src/styles/global.css`):
```css
:root {
  --color-primary: #2563eb;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-bg: #ffffff;
  --color-bg-alt: #f9fafb;
  --color-border: #e5e7eb;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-text: #f9fafb;
  --color-text-light: #d1d5db;
  --color-bg: #111827;
  --color-bg-alt: #1f2937;
  --color-border: #374151;
}
```

**Theme Toggle:**
- Located in navbar (desktop and mobile)
- Persists via localStorage
- Detects system preference
- Smooth transitions on theme change

**Implementation Details:**
- `data-theme` attribute on `<html>`
- Inline script for flash prevention
- Icon updates (sun/moon)
- All components use CSS variables

## Mobile Responsiveness

**Breakpoints:**
- Mobile: default (< 640px)
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

**Key Responsive Features:**
- Blog index: Stacked on mobile, sidebar on desktop
- Navbar: Hamburger menu on mobile
- Hero text: Responsive font sizes
- Author cards: Stack on mobile, side-by-side on desktop

## Typography Setup

**Tailwind Typography:**
- Import: `@plugin "@tailwindcss/typography";`
- Applied to blog posts: `<div class="prose prose-lg max-w-none">`
- Custom styling in global.css for code blocks, tables, etc.

**Syntax Highlighting:**
- Shiki with github-dark theme
- Code wrapping enabled

## Search Implementation

**Pagefind Integration:**
- Auto-indexes all pages during build
- Dynamic UI loading via script
- Search modal in navbar
- Configuration in astro.config.mjs

**Usage:**
- Desktop: Click search icon in navbar
- Mobile: Click search icon in mobile menu
- Modal appears with search interface

## Known Issues & Notes

1. **Author Images:** 404 errors for `/images/authors/*.jpg` (avatars using placeholder URLs)
2. **Shiki Warning:** `[Shiki] The language "dts" doesn't exist, falling back to "plaintext"` (device tree syntax in blog posts)
3. **Port Conflicts:** Dev server may use alternate ports (4322) if 4321 is occupied

## Development Workflow

**Starting Development:**
```bash
npm run dev
```

**Building for Production:**
```bash
npm run build  # Builds to dist/
npm run preview # Preview production build
```

**Using Frontmatter CMS:**
1. Open VS Code
2. Install Frontmatter CMS extension
3. Click Frontmatter icon in sidebar
4. Manage content visually

**Creating New Content:**

Blog Post:
```bash
# Create file: src/content/blog/new-post.md
# Use frontmatter.json schema for fields
```

Author:
```bash
# Create file: src/content/authors/new-author.json
# Follow authors collection schema
```

## Recent Changes (Latest Session)

### Bug Fixes Completed:
1. **Dark Mode Toggle**
   - Added CSS variables for theming
   - Created toggle buttons in navbar
   - Implemented theme persistence
   - Updated all components to use CSS variables

2. **Blog Post Styling**
   - Fixed @tailwindcss/typography import (`@plugin` syntax)
   - Enhanced prose styling
   - Updated blog post pages

3. **Mobile Layout**
   - Fixed blog index grid responsiveness
   - Sidebar now stacks on mobile
   - No more collision on small screens

### Files Modified:
- `src/styles/global.css` - Dark mode variables, typography plugin fix
- `src/layouts/Layout.astro` - Theme toggle, mobile menu styling
- `src/components/PostCard.astro` - CSS variables for dark mode
- `src/components/AuthorCard.astro` - CSS variables for dark mode
- `src/pages/index.astro` - CSS variables for dark mode
- `src/pages/blog/index.astro` - Responsive grid, CSS variables
- `src/pages/blog/[slug].astro` - CSS variables for dark mode

## Next Steps / Future Enhancements

**Potential Improvements:**
- Add author images to `/public/images/authors/`
- Add category/tag page styling improvements
- Implement pagination for blog index
- Add reading time estimation
- Add code copy buttons
- Add social sharing buttons
- Add comments system (e.g., giscus)
- Add analytics integration
- Create more blog posts
- Add search filters by category/tag
- Improve SEO with meta tags

**Content Tasks:**
- Create real author avatars
- Write more blog posts
- Add cover images for posts
- Expand author bios

## Configuration Files

**astro.config.mjs:**
```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), sitemap(), pagefind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
```

**frontmatter.json:** Configured for Blog Post content type with all fields

## Build Output
- Successfully builds 27 pages
- Generates sitemap
- Indexes all pages with Pagefind
- Output directory: `dist/`

## Project Status
✅ **COMPLETE** - All initial requirements met
✅ **COMPLETE** - All enhancements implemented
✅ **COMPLETE** - All bug fixes resolved
✅ **TESTED** - Production build succeeds
✅ **READY** - For content creation and deployment

---

*Last Updated: 2025-11-18*
*Context created for session continuity*
