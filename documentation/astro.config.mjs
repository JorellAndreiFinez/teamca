import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'TeamCA Documentation',
      description: 'Complete documentation for the TeamCA intern management system',
      logo: {
        light: '/src/assets/white-bg-ver.svg',
        dark: '/src/assets/black-bg-ver.svg',
        alt: 'TeamCA Logo',
      },
      sidebar: [
        {
          label: 'Getting Started',
          collapsed: false,
          items: [
            { label: 'Quick Start Guide', slug: 'index' },
          ],
        },
        {
          label: 'Important Guides',
            collapsed: false,
          items: [
            { label: 'Development Setup', slug: 'guides/development-setup' },
            { label: 'Starlight Configuration', slug: 'guides/starlight-config' },
          ],
        },
        {
          label: 'Architecture',
          collapsed: true,
          items: [
            { label: 'System Overview', slug: 'architecture/overview' },
            { label: 'Data Models', slug: 'architecture/data-models' },
          ],
        },
        {
          label: 'Backend',
          collapsed: true,
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
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'frontend/overview' },
            { label: 'Components', slug: 'frontend/components' },
            { label: 'Features Structure', slug: 'frontend/features' },
            { label: 'Hooks & Custom Hooks', slug: 'frontend/hooks' },
            { label: 'State Management (Zustand)', slug: 'frontend/store' },
            { label: 'Pages & Routing', slug: 'frontend/pages' },
          ],
        },
        {
          label: 'Modules',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'modules/overview' },
            { label: 'Tasks Module', slug: 'modules/tasks' },
            { label: 'DTR (Daily Time Records)', slug: 'modules/dtr' },
            { label: 'Notifications', slug: 'modules/notifications' },
            { label: 'Authentication & Authorization', slug: 'modules/auth' },
            { label: 'Activity Logs', slug: 'modules/activity-logs' },
            { label: 'User Profiles', slug: 'modules/profiles' },
            { label: 'Dashboard', slug: 'modules/dashboard' },
            { label: 'Superadmin Management', slug: 'modules/superadmin' },
          ],
        },
        {
          label: 'Roles & Access Control',
          collapsed: true,
          items: [
            { label: 'RBAC System', slug: 'roles/overview' },
            { label: 'Superadmin Role', slug: 'roles/superadmin' },
            { label: 'Admin Role', slug: 'roles/admin' },
            { label: 'Standard User Role', slug: 'roles/user' },
          ],
        },
        {
          label: 'API Reference',
          collapsed: true,
          items: [
            { label: 'Endpoints Overview', slug: 'api/overview' },
            { label: 'Usage & Services', slug: 'api/api-usage' },
          ],
        }
      ],
      favicon: '/favicon.ico',
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/JorellAndreiFinez/TeamCA/edit/main/documentation/',
      },
    }),
  ],
  output: 'static',
  outDir: '../website/docs',
});
