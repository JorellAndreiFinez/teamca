---
title: Starlight Configuration
description: Complete guide to configuring Astro Starlight for TeamCA documentation
---

## Overview

Astro Starlight is configured through `astro.config.mjs` in the documentation root folder. This guide covers all available configuration options.

---

## 📝 Content Guidelines

### Markdown Front Matter

Every page should have:

```markdown
---
title: Page Title
description: Short description shown in search results
---
```

### Writing Tips

- Use clear, concise language
- Include code examples from actual codebase
- Link to related pages
- Keep headings descriptive
- Use tables for comparisons
- Use callout boxes for important info

### Example Page Structure

```markdown
---
title: Task Management
description: Complete guide to task management in TeamCA
---

# Task Management

Brief introduction explaining what this page covers.

## Overview

Key concepts and architecture.

## How It Works

Explain the flow and process.

## API Reference

Document endpoints and examples.

## Example Workflow

Real-world example with code.
```

---

### Update When

- API endpoints change
- Architecture changes
- New features are implemented
- Bug fixes affect documented behavior
- Every code review/pull request (recommended)

### How to Update

1. Edit markdown files in `src/content/docs/`
2. Changes auto-reload in dev server
3. Check http://localhost:3000
4. Commit and push changes

---

## Basic Setup

### 1. Installation

Starlight is already installed via `package.json`:

```bash
cd documentation
npm install
```

Dependencies:
- `astro` ^5.0.0
- `@astrojs/starlight` ^0.28.0

### 2. Main Configuration File

Edit `astro.config.mjs` in the `/documentation` root:

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      // Configuration options go here
    }),
  ],
});
```

## Configuration Options

### Site Metadata

```javascript
starlight({
  // Site title (required)
  title: 'TeamCA Documentation',
  
  // Site description
  description: 'Complete documentation for the TeamCA intern management system',
  
  // Default language
  defaultLocale: 'en',
  
  // Logo configuration
  logo: {
    light: '/src/assets/logo-light.svg',
    dark: '/src/assets/logo-dark.svg',
    alt: 'TeamCA Logo',
  },
})
```

### Sidebar Navigation

Configure page hierarchy and navigation:

```javascript
sidebar: [
  {
    label: 'Getting Started',
    items: [
      { label: 'Overview', slug: 'index' },
      { label: 'Quick Start', slug: 'getting-started/quickstart' },
    ],
  },
  {
    label: 'Architecture',
    items: [
      { label: 'System Overview', slug: 'architecture/overview' },
      { label: 'Data Models', slug: 'architecture/data-models' },
    ],
  },
  {
    label: 'Backend',
    collapsed: false,  // Keep expanded by default
    items: [
      { label: 'Overview', slug: 'backend/overview' },
      { label: 'Controllers', slug: 'backend/controllers' },
      { label: 'Services', slug: 'backend/services' },
      { label: 'Middlewares', slug: 'backend/middlewares' },
      { label: 'Real-time (Socket.io)', slug: 'backend/socket' },
    ],
  },
  {
    label: 'Frontend',
    items: [
      { label: 'Overview', slug: 'frontend/overview' },
    ],
  },
  {
    label: 'Modules',
    items: [
      { label: 'Overview', slug: 'modules/overview' },
      { label: 'Authentication', slug: 'modules/auth' },
      { label: 'Tasks', slug: 'modules/tasks' },
      { label: 'DTR', slug: 'modules/dtr' },
      { label: 'Notifications', slug: 'modules/notifications' },
    ],
  },
  {
    label: 'API Reference',
    items: [
      { label: 'Overview', slug: 'api/overview' },
      { label: 'Authentication', slug: 'api/auth' },
      { label: 'Tasks', slug: 'api/tasks' },
    ],
  },
  {
    label: 'Guides',
    items: [
      { label: 'Development Setup', slug: 'guides/development-setup' },
      { label: 'Starlight Config', slug: 'guides/starlight-config' },
    ],
  },
]
```

### Theme Customization

```javascript
// Built-in themes
starlight({
  // CSS variables for colors
  customCss: [
    './src/styles/custom.css',
  ],
})
```

Create `src/styles/custom.css`:

```css
:root {
  /* Colors */
  --sl-color-white: #ffffff;
  --sl-color-gray-1: #f6f7ff;
  --sl-color-gray-2: #eeeff5;
  --sl-color-gray-3: #c0c7e0;
  --sl-color-gray-4: #888eb0;
  --sl-color-gray-5: #747d9f;
  --sl-color-gray-6: #606479;
  --sl-color-black: #0c0e27;
  
  /* Accent color */
  --sl-color-accent: #0066cc;
  
  /* Typography */
  --sl-font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --sl-font-mono: 'Monaco', 'Courier New', monospace;
}

/* Dark mode overrides */
:root[data-theme='dark'] {
  --sl-color-accent: #4da6ff;
}
```

### Social Links

```javascript
social: {
  github: 'https://github.com/yourorg/teamca',
  twitter: 'https://twitter.com/yourhandle',
  linkedin: 'https://linkedin.com/company/yourcompany',
}
```

### Edit Link

Enable "Edit on GitHub" for all pages:

```javascript
editLink: {
  baseUrl: 'https://github.com/yourorg/teamca/edit/main/documentation/src/content/docs/',
}
```

Users can click "Edit" to create a pull request on GitHub.

### Features

Enable/disable built-in features:

```javascript
starlight({
  // Built-in features
  disable: {
    splash: false,           // Show splash page
    sidebar: false,          // Show sidebar
    toc: false,              // Table of contents on right
    pagefind: false,         // Built-in search
    head: false,             // Custom HTML in <head>
    components: false,       // Custom components
  },
})
```

### Search Configuration

Starlight uses Pagefind for search (automatic):

```javascript
// Already configured by default
// Search index generated automatically during build
```

Users get full-text search on all pages automatically.

### Build & Output

```javascript
// Output directory (default: dist)
outDir: './dist',

// Staging directory for builds
stagingDir: './_site',
```

Build output goes to `dist/` → symlinked to `../website/docs/`

## Directory Structure

Starlight expects documentation in `src/content/docs/`:

```
documentation/
├── src/
│   ├── assets/              # Images, logos
│   │   ├── logo-light.svg
│   │   └── logo-dark.svg
│   ├── content/
│   │   └── docs/            # All documentation
│   │       ├── index.md     # Homepage
│   │       ├── architecture/
│   │       ├── backend/
│   │       ├── frontend/
│   │       ├── modules/
│   │       ├── roles/
│   │       ├── api/
│   │       └── guides/
│   └── styles/
│       └── custom.css
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Page Front Matter

Every page should have front matter:

```markdown
---
title: Page Title
description: Short description shown in search and meta tags
sidebar:
  label: Custom Label
  order: 1
---

# Page Content Here

Your markdown content...
```

## Components

Starlight provides built-in components:

### Tabs

```markdown
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="JavaScript">
    ```javascript
    console.log('Hello');
    ```
  </TabItem>
  <TabItem label="Python">
    ```python
    print('Hello')
    ```
  </TabItem>
</Tabs>
```

### Aside (Callout)

```markdown
:::note
This is a note
:::

:::caution
This is a warning
:::

:::danger
This is a danger message
:::

:::tip
This is a tip
:::
```

### Cards

```markdown
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Card Title 1" icon="star">
    Card description
  </Card>
  <Card title="Card Title 2" icon="heart">
    Another card
  </Card>
</CardGrid>
```

## Build Process

### Development Server

```bash
npm run dev
```

- Starts at `http://localhost:3000`
- Hot reload on file changes
- No build necessary

### Production Build

```bash
npm run build
```

- Generates static HTML/CSS/JS
- Optimizes images
- Creates search index
- Output: `dist/`

### Preview Build

```bash
npm run preview
```

- Start local preview of production build
- Test final output before deployment

## Advanced Configuration

### Multiple Languages

```javascript
starlight({
  defaultLocale: 'en',
  locales: {
    en: { label: 'English' },
    es: { label: 'Español' },
    fr: { label: 'Français' },
  },
  // Pages per language:
  // src/content/docs/en/index.md
  // src/content/docs/es/index.md
})
```

### Custom Redirects

```javascript
// astro.config.mjs
redirects: {
  '/old-page': '/new-page',
  '/docs/legacy': '/guides/current',
}
```

### Integrations

Add additional Astro integrations:

```javascript
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    starlight({...}),
    react(),
    tailwind(),
  ],
});
```

## Environment Variables

Starlight uses standard Astro environment variables:

```bash
# .env
PUBLIC_API_URL=https://api.example.com
```

Access in markdown with:

```javascript
import.meta.env.PUBLIC_API_URL
```

## TypeScript

Starlight has full TypeScript support. Config is already typed:

```javascript
// astro.config.mjs
import type { Config } from 'astro/config';

export const config: Config = {
  // Full type checking
};
```

## Performance Optimization

### Image Optimization

```javascript
// astro.config.mjs
image: {
  service: {
    entrypoint: 'astro/assets/services/sharp',
  },
}
```

### CSS Minification

Already enabled in production builds.

### Code Splitting

Automatic - Starlight generates optimal chunks.

## Security

### Content Security Policy

Add to `astro.config.mjs`:

```javascript
security: {
  checkOrigin: true,
}
```

### HTTPS

Always use HTTPS in production.

## CI/CD Integration

### GitHub Actions

```yaml
name: Build Docs

on:
  push:
    branches: [main]
    paths: ['documentation/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: cd documentation && npm install
      
      - run: cd documentation && npm run build
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/docs
```

## Troubleshooting

### Build Fails

```bash
# Clear cache
npm run docs:clean
rm -rf .astro node_modules/.vite

# Rebuild
npm install
npm run build
```

### Search Not Working

- Search index builds automatically during build
- Check `dist/pagefind/` exists after build
- Refresh browser to reload index

### Styling Issues

- Clear browser cache (Ctrl+F5)
- Check `src/styles/custom.css` syntax
- Restart dev server

## Next Steps

- Read the [Astro Starlight Docs](https://starlight.astro.build)
- Explore [Astro Configuration](https://docs.astro.build/en/reference/configuration-reference/)
- Check the [API Reference](./api/overview)

---

**Tip**: The `astro.config.mjs` in this project is pre-configured. Most users don't need to modify it.
