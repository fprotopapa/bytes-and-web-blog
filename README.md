# Embedded Linux Blog

A static blog built with Astro, focused on embedded Linux topics including kernel development, build systems, bootloaders, and hardware integration.

## Features

- **Multi-author support** - Multiple collaborators can contribute
- **Content organization** - Posts organized by tags and categories
- **Author profiles** - Each author has a profile page with bio, avatar, and social links
- **Mobile-first responsive design** - Tailwind CSS with fully responsive components
- **Built-in search** - Pagefind integration for fast client-side search
- **Content management** - Frontmatter CMS for easy content editing in VS Code
- **RSS feed** - Subscribe to updates at `/rss.xml`
- **Syntax highlighting** - Code blocks with GitHub Dark theme
- **SEO optimized** - Meta tags, sitemap, and semantic HTML
- **Static site generation** - Fast loading and easy deployment

## Project Structure

```
/
├── public/              # Static assets
│   └── images/
│       ├── authors/     # Author avatar images
│       └── posts/       # Post cover images
├── src/
│   ├── components/      # Reusable Astro components
│   │   ├── AuthorCard.astro
│   │   └── PostCard.astro
│   ├── content/         # Content collections
│   │   ├── config.ts    # Content schema definitions
│   │   ├── authors/     # Author JSON files
│   │   └── blog/        # Blog post markdown files
│   ├── layouts/         # Page layouts
│   │   └── Layout.astro
│   └── pages/           # File-based routing
│       ├── index.astro            # Home page
│       ├── blog/
│       │   ├── index.astro        # All posts
│       │   └── [slug].astro       # Single post
│       ├── authors/
│       │   └── [slug].astro       # Author profile
│       ├── tags/
│       │   ├── index.astro        # All tags
│       │   └── [tag].astro        # Posts by tag
│       ├── categories/
│       │   ├── index.astro        # All categories
│       │   └── [category].astro   # Posts by category
│       └── rss.xml.ts             # RSS feed
└── astro.config.mjs     # Astro configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:4321` to see your blog.

### Building for Production

```bash
npm run build
```

The static site will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Adding Content

### Adding a New Author

Create a JSON file in `src/content/authors/`:

```json
{
  "name": "Your Name",
  "bio": "Your bio here",
  "avatar": "/images/authors/your-avatar.jpg",
  "email": "your@email.com",
  "github": "https://github.com/yourusername",
  "linkedin": "https://linkedin.com/in/yourusername",
  "website": "https://yoursite.com"
}
```

### Adding a New Blog Post

Create a Markdown file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
description: "A brief description of your post"
pubDate: 2024-11-18
author: your-author-id
coverImage: "/images/posts/your-image.jpg"
tags: ["tag1", "tag2", "tag3"]
category: "Category Name"
draft: false
---

Your post content here...
```

The `author` field should match the filename (without `.json`) of an author in `src/content/authors/`.

## Content Schema

### Author Schema

- `name` (required): Full name
- `bio` (required): Short biography
- `avatar` (required): Path to avatar image
- `email` (optional): Email address
- `github` (optional): GitHub profile URL
- `linkedin` (optional): LinkedIn profile URL
- `website` (optional): Personal website URL

### Blog Post Schema

- `title` (required): Post title
- `description` (required): Post description/excerpt
- `pubDate` (required): Publication date
- `updatedDate` (optional): Last updated date
- `author` (required): Reference to author ID
- `coverImage` (optional): Cover image path
- `tags` (required): Array of tags
- `category` (required): Post category
- `draft` (optional): Set to true to exclude from build

## Customization

### Update Site URL

Edit `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://yourdomain.com', // Your actual domain
  // ...
});
```

### Change Theme Colors

Edit the CSS variables in `src/layouts/Layout.astro`:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1e40af;
  /* ... */
}
```

### Modify Navigation

Edit the navigation links in `src/layouts/Layout.astro` (around line 107).

## Deployment

This is a static site and can be deployed to:

- **Netlify**: Connect your Git repo and deploy
- **Vercel**: Import your project and deploy
- **GitHub Pages**: Use GitHub Actions
- **Cloudflare Pages**: Connect and deploy
- **Any static host**: Upload the `dist/` folder

## Commands

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Install dependencies                             |
| `npm run dev`          | Start dev server at `localhost:4321`            |
| `npm run build`        | Build production site to `./dist/`              |
| `npm run preview`      | Preview production build locally                 |
| `npm run astro ...`    | Run Astro CLI commands                          |

## Technologies Used

- [Astro](https://astro.build) - Static site framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Pagefind](https://pagefind.app/) - Static site search
- [Front Matter CMS](https://frontmatter.codes/) - Content management in VS Code
- [MDX](https://mdxjs.com/) - Markdown with components
- [Shiki](https://shiki.matsu.io/) - Syntax highlighting

## Using the Search Feature

The blog includes a built-in search powered by Pagefind. After building the site, search will automatically index all blog posts, titles, and content.

- Click the search icon in the navbar (desktop or mobile)
- Type your query to search across all posts
- Results appear instantly with relevant excerpts
- Search works entirely client-side with no backend needed

## Using Frontmatter CMS

Frontmatter CMS provides a content management interface directly in VS Code:

### Installation

1. Install the [Front Matter CMS extension](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-front-matter) in VS Code
2. Open your project in VS Code
3. The CMS will automatically detect the `frontmatter.json` configuration

### Managing Content

- Open the Front Matter panel in VS Code (icon in the sidebar)
- Browse your blog posts in the dashboard
- Create new posts with the "Create content" button
- Edit frontmatter fields with a visual interface
- Preview posts before publishing
- Manage drafts and published status
- Upload and manage images

### Content Types

The blog is configured with one content type:
- **Blog Post**: Includes title, description, dates, author, tags, category, and draft status

## License

MIT

## Contributing

This blog is designed for multiple collaborators. To contribute:

1. Add yourself as an author in `src/content/authors/`
2. Create your blog posts in `src/content/blog/`
3. Reference your author ID in the post frontmatter
4. Submit a pull request

## Support

For Astro-related questions, visit the [Astro documentation](https://docs.astro.build).
