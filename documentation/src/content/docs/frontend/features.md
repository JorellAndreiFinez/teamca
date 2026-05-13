---
title: Frontend Features Structure
description: Feature modules and how to structure application features
---

The frontend is organized by feature modules, each containing components, pages, services, and state management for that specific domain.

## Feature-Based Architecture

```
frontend/src/features/
├── auth/              # Authentication
├── tasks/             # Task Management
├── dtr/               # Daily Time Records
├── notifications/     # Notifications
├── profile/           # User Profiles
├── activityLogs/      # Activity Logs
├── dashboard/         # Dashboard
└── superadmin/        # Admin Features
```

## Feature Module Structure

Each feature module should follow this structure:

```
features/MODULE/
├── components/        # React components
│   ├── List.tsx
│   ├── Detail.tsx
│   ├── Form.tsx
│   └── Card.tsx
├── pages/            # Astro page files
│   └── index.astro
├── services/         # API calls (optional)
│   └── service.ts
├── store/            # Zustand store slices
│   └── store.ts
├── types/            # TypeScript types
│   └── types.ts
├── hooks/            # Custom hooks
│   └── useFeature.ts
└── utils/            # Helper functions
    └── helpers.ts
```

## Feature: Tasks Module

### Directory Layout
```
features/tasks/
├── components/
│   ├── TaskList.tsx        # Display list of tasks
│   ├── TaskDetail.tsx      # Task details view
│   ├── TaskForm.tsx        # Create/edit task form
│   ├── TaskCard.tsx        # Individual task card
│   ├── AssignmentForm.tsx  # Assign task to user
│   ├── StatusTracker.tsx   # Status change UI
│   ├── Comments.tsx        # Comments section
│   └── Feedback.tsx        # Feedback section
├── pages/
│   └── tasks.astro         # /tasks route
├── store/
│   └── taskStore.ts        # Zustand store
├── types/
│   └── types.ts
└── services/
    └── taskService.ts      # API calls
```

### Key Files & Responsibilities

| File | Purpose |
|---|---|
| `components/TaskList.tsx` | Renders paginated list of tasks with filtering |
| `components/TaskDetail.tsx` | Full task view with comments and feedback |
| `components/TaskForm.tsx` | Create/edit form for tasks |
| `store/taskStore.ts` | Global state (tasks, filters, selected task) |
| `services/taskService.ts` | API calls to /api/tasks |
| `pages/tasks.astro` | Astro page wrapper |

## Feature: Dashboard Module

### Components Hierarchy
```
Dashboard Page
├── Header
├── StatsWidget
│   ├── TaskStats
│   ├── DTRStats
│   └── PerformanceStats
├── TaskWidget
│   └── TaskList (short)
├── TimelineWidget
│   └── ActivityTimeline
└── RecentActivity
    └── ActivityList
```

### Data Flow
```
Dashboard Load
  ↓
Load stats from dashboardStore
  ↓
Fetch all needed data
  ├─ GET /api/tasks/summary
  ├─ GET /api/dtr/summary
  ├─ GET /api/activity/recent
  └─ GET /api/notifications/unread
  ↓
Update Zustand store
  ↓
Components subscribe to store
  ↓
Render with loaded data
```

## Feature: Auth Module

### Special Handling
Auth is used across the entire app:

```typescript
// In any component
const { user, isAuthenticated, logout } = useAuthStore();

// Protect routes
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// Check roles
<RoleGuard requiredRole="ADMIN">
  <AdminContent />
</RoleGuard>
```

## Feature: Admin (Superadmin)

### Restricted Components
```
features/superadmin/
├── components/
│   ├── UserManagement/
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   └── RoleAssignment.tsx
│   ├── SystemSettings/
│   │   ├── Settings.tsx
│   │   └── ConfigForm.tsx
│   └── Reports/
│       ├── ReportGenerator.tsx
│       └── ReportViewer.tsx
└── pages/
    └── admin.astro
```

**Access**: Only SUPERADMIN role can access

## Creating a New Feature

1. **Create directory** `features/newfeature/`
2. **Create subdirectories** components, pages, store, types
3. **Create types** defining data interfaces
4. **Create Zustand store** for feature state
5. **Create components** for UI
6. **Create Astro page** to mount feature
7. **Add routes** in main router

## State Management Pattern

Each feature's Zustand store:

```typescript
// store/featureStore.ts
import { create } from 'zustand';

interface FeatureState {
  items: Item[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  selectItem: (id: string) => void;
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
}

export const useFeatureStore = create<FeatureState>((set) => ({
  items: [],
  selectedId: null,
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true });
    try {
      const items = await api.get('/items');
      set({ items, error: null });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  selectItem: (id) => set({ selectedId: id }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item._id !== id)
  }))
}));
```

## Service Integration

Each feature should have services for API calls:

```typescript
// services/featureService.ts
import { api } from '@/lib/api';

export const featureService = {
  getAll: () => api.get('/api/feature'),
  getById: (id: string) => api.get(`/api/feature/${id}`),
  create: (data) => api.post('/api/feature', data),
  update: (id: string, data) => api.put(`/api/feature/${id}`, data),
  delete: (id: string) => api.delete(`/api/feature/${id}`)
};
```

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Components](/frontend/components) | Component patterns |
| [Frontend Hooks](/frontend/hooks) | Custom hooks and patterns |
| [State Management Store](/frontend/store) | Zustand detailed guide |
