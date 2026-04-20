---
title: Frontend Architecture & Pages
description: Frontend page structure and routing system
---

The frontend uses **Astro 5** with **React 18** integration for building interactive pages and components with file-based routing.

## Page Structure

### Directory Layout

```
frontend/src/pages/
├── index.astro              # / (Dashboard)
├── activity-logs.astro      # /activity-logs
├── auth/
│   └── login.astro          # /auth/login
│   └── logout.astro         # /auth/logout
├── dtr.astro                # /dtr
├── notifications.astro      # /notifications
├── profile/
│   ├── index.astro          # /profile
│   └── [id].astro           # /profile/:id
├── tasks/
│   ├── index.astro          # /tasks
│   └── [id].astro           # /tasks/:id
├── superadmin/
│   ├── index.astro          # /superadmin (admin dashboard)
│   ├── users.astro          # /superadmin/users
│   ├── departments.astro    # /superadmin/departments
│   ├── reports.astro        # /superadmin/reports
│   └── settings.astro       # /superadmin/settings
└── 404.astro                # Catch-all 404 page
```

## File-Based Routing

Astro automatically creates routes based on file structure:

| File | Route |
|---|---|
| `pages/index.astro` | `/` |
| `pages/about.astro` | `/about` |
| `pages/blog/index.astro` | `/blog` |
| `pages/blog/[slug].astro` | `/blog/:slug` (dynamic) |
| `pages/api/tasks.ts` | API endpoint: `/api/tasks` |

## Dynamic Routes

### Dynamic Task Page

```typescript
// pages/tasks/[id].astro
---
import { getTaskById } from '@/services/taskService';

interface Props {
  id: string;
}

const { id } = Astro.params as Props;
const task = await getTaskById(id);
---

<DashboardLayout>
  <TaskDetail task={task} />
</DashboardLayout>
```

### Generate Static Paths

```typescript
// pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post }
  }));
}
```

## Page Wrappers

Each page is wrapped in a layout component that provides consistent UI:

```typescript
// pages/tasks.astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import TaskList from '@/features/tasks/components/TaskList';
---

<DashboardLayout>
  <div class="container">
    <h1>Tasks</h1>
    <TaskList client:load />
  </div>
</DashboardLayout>
```

## Layouts

### DashboardLayout

Used for authenticated pages with navigation:

```
┌─────────────────────────────────────┐
│ Header (Navbar)                     │
├──────────┬──────────────────────────┤
│ Sidebar  │ Page Content             │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

### AuthLayout

Used for login/signup pages:

```
┌─────────────────────────────────────┐
│ Logo                                │
├─────────────────────────────────────┤
│ Form Component (centered)           │
│                                     │
│ (Login / Signup / Reset Password)   │
└─────────────────────────────────────┘
```

## Route Protection

### Public Routes
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`

### Protected Routes (require authentication)
```typescript
// In DashboardLayout.astro
import { useAuthStore } from '@/store/authStore';

const { isAuthenticated } = useAuthStore();

if (!isAuthenticated) {
  // Redirect to login
  return Astro.redirect('/auth/login');
}
```

### Role-Protected Routes
```typescript
// In superadmin layout
import { useAuthStore } from '@/store/authStore';

const { user } = useAuthStore();

if (user?.globalRole !== 'SUPERADMIN') {
  return Astro.redirect('/');
}
```

## API Routes

### Create API Endpoints

```typescript
// pages/api/tasks.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const tasks = await fetchTasks();
  return new Response(JSON.stringify(tasks), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newTask = await createTask(data);
  return new Response(JSON.stringify(newTask), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Component Integration

### Using React Components in Astro

```typescript
// pages/dashboard.astro
---
import Dashboard from '@/features/dashboard/components/Dashboard';
---

<!-- client:load = hydrate on page load -->
<Dashboard client:load />

<!-- client:idle = hydrate when idle -->
<TaskWidget client:idle />

<!-- client:visible = hydrate when visible -->
<NotificationPanel client:visible />

<!-- client:only = client-side only (no SSR) -->
<RealTimeChat client:only="react" />
```

## Navigation Pattern

### Client-Side Navigation
```typescript
import { useNavigate } from '@/hooks/useNavigate';

const navigate = useNavigate();

const handleClick = () => {
  navigate('/tasks/123');
};
```

### Server-Side Redirect
```typescript
// In Astro page
if (!isAuthenticated) {
  return Astro.redirect('/auth/login');
}
```

## URL Query Parameters

### Reading Query Params
```typescript
// pages/tasks.astro
const { status, department } = Astro.url.searchParams;
// Handles: /tasks?status=done&department=eng
```

### Building Query Strings
```typescript
const params = new URLSearchParams({
  status: 'active',
  page: '1',
  sort: 'createdAt'
});

const url = `/tasks?${params.toString()}`;
// Results in: /tasks?status=active&page=1&sort=createdAt
```

## 404 & Error Handling

```typescript
// pages/404.astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
---

<DashboardLayout>
  <div class="error-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  </div>
</DashboardLayout>
```

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Components](/frontend/components) | Component patterns |
| [Frontend Features](/frontend/features) | Feature modules |
| [Frontend Hooks](/frontend/hooks) | Custom hooks library |
