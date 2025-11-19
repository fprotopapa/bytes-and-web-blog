# Embedding YouTube Videos in Blog Posts

This blog supports embedding YouTube videos using a custom component.

## Basic Usage

In your MDX blog post, import the YouTube component and use it:

```mdx
---
title: "My Blog Post"
description: "A post with video"
pubDate: 2024-11-19
author: jane-smith
tags: ["tutorial"]
category: "Tutorials"
---

import YouTube from '../../components/YouTube.astro';

# My Blog Post with Video

Here's a tutorial video:

<YouTube id="dQw4w9WgXcQ" />

Regular markdown content continues here...
```

## Component Props

### `id` (required)
The YouTube video ID from the URL.

Example: For `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ`

```mdx
<YouTube id="dQw4w9WgXcQ" />
```

### `title` (optional)
Custom title for accessibility. Defaults to "YouTube video player".

```mdx
<YouTube id="dQw4w9WgXcQ" title="Tutorial on embedded Linux" />
```

### `start` (optional)
Start time in seconds. Useful for linking to specific parts of longer videos.

```mdx
<!-- Start at 1 minute 30 seconds (90 seconds) -->
<YouTube id="dQw4w9WgXcQ" start={90} />
```

## Complete Examples

### Example 1: Simple Video Embed

```mdx
import YouTube from '../../components/YouTube.astro';

## Building Your First Yocto Image

Watch this video tutorial to get started:

<YouTube id="example123" title="Yocto Build Tutorial" />

After watching the video, try these commands...
```

### Example 2: Video with Context

```mdx
import YouTube from '../../components/YouTube.astro';

## Kernel Configuration Demo

Below is a live demonstration of configuring the Linux kernel:

<YouTube id="kernel-demo" title="Linux Kernel Configuration" />

**Key takeaways from the video:**
- Always backup your config
- Use menuconfig for interactive editing
- Test incrementally
```

### Example 3: Multiple Videos

```mdx
import YouTube from '../../components/YouTube.astro';

## Complete Tutorial Series

### Part 1: Setup
<YouTube id="part1-id" title="Setup Tutorial" />

### Part 2: Configuration
<YouTube id="part2-id" title="Configuration Tutorial" />

### Part 3: Deployment
<YouTube id="part3-id" title="Deployment Tutorial" />
```

### Example 4: Video Starting at Specific Time

```mdx
import YouTube from '../../components/YouTube.astro';

## Advanced Features

Skip to the advanced configuration section:

<YouTube id="advanced-tutorial" start={300} />
<!-- Starts at 5:00 (300 seconds) -->
```

## Finding YouTube Video IDs

From a YouTube URL like:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`
- `https://www.youtube.com/embed/dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`

## Features

- **Responsive**: Automatically adapts to screen size
- **Privacy-friendly**: Uses `youtube-nocookie.com` domain
- **Accessible**: Includes proper title attributes
- **Styled**: Matches blog design with rounded corners and shadow
- **Aspect Ratio**: Maintains 16:9 ratio on all devices

## Note for Markdown Files

This component only works in `.mdx` files, not regular `.md` files.

To convert a `.md` file to `.mdx`:
1. Rename `your-post.md` to `your-post.mdx`
2. Add the import statement at the top
3. Use the component as shown above

## Alternative: Raw HTML (Not Recommended)

If you must use HTML directly in markdown:

```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; margin: 2rem 0;">
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 0.5rem;"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>
```

However, using the component is strongly preferred for consistency and maintainability.
