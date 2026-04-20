---
title: State Management - Zustand Store
description: Global state management using Zustand
---

The frontend uses **Zustand** for lightweight, decentralized state management without boilerplate.

## Why Zustand?

- **Minimal boilerplate**: No reducers, actions, or middleware required
- **TypeScript support**: Full type safety
- **Decentralized**: Each feature has its own store
- **No provider hell**: No context provider wrapping needed
- **Efficient updates**: Only subscribed components re-render

## Store Structure

```
frontend/src/store/
├── taskStore.ts          # Task state
├── authStore.ts          # Auth state
├── dtrStore.ts           # DTR state
├── notificationStore.ts  # Notifications
├── profileStore.ts       # User profile
├── dashboardStore.ts     # Dashboard state
└── filters/              # Filter states
    ├── taskFilters.ts
    └── dateFilters.ts
```

## Creating a Store

### Basic Store Pattern

```typescript
// store/taskStore.ts
import { create } from 'zustand';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  deadline: Date;
}

interface TaskState {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
  filter: {
    status: string | null;
    searchQuery: string;
  };

  // Actions
  fetchTasks: () => Promise<void>;
  selectTask: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (key: string, value: any) => void;
  clearFilter: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
  filter: {
    status: null,
    searchQuery: ''
  },

  // Actions
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const data = await fetch('/api/tasks').then(r => r.json());
      set({ tasks: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  selectTask: (id: string) => {
    const { tasks } = get();
    const selected = tasks.find(t => t._id === id);
    set({ selectedTask: selected || null });
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: [...state.tasks, task]
    }));
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await response.json();
      
      set((state) => ({
        tasks: state.tasks.map(t => t._id === id ? updated : t),
        error: null
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true });
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      set((state) => ({
        tasks: state.tasks.filter(t => t._id !== id),
        error: null
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setFilter: (key: string, value: any) => {
    set((state) => ({
      filter: { ...state.filter, [key]: value }
    }));
  },

  clearFilter: () => {
    set({
      filter: { status: null, searchQuery: '' }
    });
  }
}));
```

## Using Stores in Components

### Basic Usage
```typescript
import { useTaskStore } from '@/store/taskStore';

export const TaskList = () => {
  const { tasks, loading, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  );
};
```

### Selective Subscription (Performance)
```typescript
// Only re-render when tasks change, not when other state changes
const tasks = useTaskStore((state) => state.tasks);
const addTask = useTaskStore((state) => state.addTask);

// Or with selector function for complex selections
const filteredTasks = useTaskStore((state) => {
  const filter = state.filter;
  return state.tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.searchQuery && !t.title.includes(filter.searchQuery)) return false;
    return true;
  });
});
```

### Shallow Comparison for Objects
```typescript
// For selecting multiple state values at once
const { tasks, loading } = useTaskStore(
  (state) => ({
    tasks: state.tasks,
    loading: state.loading
  }),
  shallow // Compare only first level
);
```

## Store Patterns

### Computed Values (Selectors)

```typescript
export const useTaskStore = create<TaskState>((set, get) => ({
  // ... other state ...

  // Selector: Computed value
  getTasksByStatus: (status: string) => {
    return get().tasks.filter(t => t.status === status);
  },

  getTotalTasks: () => {
    return get().tasks.length;
  },

  getCompletedPercentage: () => {
    const { tasks } = get();
    const completed = tasks.filter(t => t.status === 'DONE').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }
}));

// Usage
const totalTasks = useTaskStore((state) => state.getTotalTasks());
const tasksByStatus = useTaskStore((state) => state.getTasksByStatus('DONE'));
```

### Async Actions with Error Handling

```typescript
fetchTasks: async () => {
  set({ loading: true, error: null });
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    set({ tasks: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    set({ error: message });
    console.error('Fetch error:', message);
  } finally {
    set({ loading: false });
  }
}
```

### Nested Store Updates

```typescript
updateFilter: (updates: Partial<FilterState>) => {
  set((state) => ({
    filter: {
      ...state.filter,
      ...updates
    }
  }));
}
```

## Auth Store Example

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  token: localStorage.getItem('authToken'),

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const { token, user } = await response.json();
      localStorage.setItem('authToken', token);

      set({
        token,
        user,
        isAuthenticated: true,
        loading: false
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({
      user: null,
      isAuthenticated: false,
      token: null
    });
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await response.json();
      set({ user, isAuthenticated: true });
    } catch {
      set({ isAuthenticated: false });
      localStorage.removeItem('authToken');
    }
  }
}));
```

## Best Practices

### 1. Keep Stores Focused
```typescript
// ✓ Good: Each store has one responsibility
useTaskStore   // Only task state
useAuthStore   // Only auth state
useDtrStore    // Only DTR state

// ✗ Bad: Mixing concerns
useAppStore    // Too broad
```

### 2. Use Selectors for Performance
```typescript
// ✓ Good: Only subscribe to needed state
const tasks = useTaskStore(state => state.tasks);

// ✗ Bad: Subscribe to entire store
const store = useTaskStore(); // Re-renders on any change
```

### 3. Keep Actions Pure
```typescript
// ✓ Good: Predictable, testable
addTask: (task) => set(state => ({
  tasks: [...state.tasks, task]
}))

// ✗ Bad: Side effects in action
addTask: (task) => {
  // Don't call other stores directly
  otherStore.doSomething();
}
```

### 4. Type Everything
```typescript
// ✓ Good: Full TypeScript support
interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
}

// ✗ Bad: Using any
const store: any = create({...})
```

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Components](/frontend/components) | Using store in components |
| [Frontend Hooks](/frontend/hooks) | Custom hooks patterns |
| [Frontend Features](/frontend/features) | Store per feature |
