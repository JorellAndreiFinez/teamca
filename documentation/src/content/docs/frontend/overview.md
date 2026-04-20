---
title: Frontend Architecture
description: Complete guide and overview for frontend architecture
---

## Overview

The frontend is an **Astro + React** dashboard application for internal users. It provides a modern UI for task management, time tracking, notifications, and profile management.

## Stack

- **Framework**: Astro 5.18
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 4.4
- **HTTP Client**: Axios 1.6
- **Real-time**: Socket.io Client 4.8
- **UI Components**: Radix UI, Lucide Icons
- **Type Safety**: TypeScript

## Project Structure

```
frontend/
├─ src/
│  ├─ pages/                   # Route pages
│  │  ├─ index.astro           # Dashboard home
│  │  ├─ login.astro           # Login page
│  │  ├─ dashboard.astro       # Main dashboard
│  │  ├─ tasks.astro           # Tasks list
│  │  ├─ dtr.astro             # Time tracking
│  │  ├─ profile.astro         # User profile
│  │  ├─ notifications.astro   # Notifications
│  │  ├─ activity-logs.astro   # Activity logs
│  │  ├─ superadmin.astro      # Admin dashboard
│  │  └─ setup.astro           # Initial setup
│  │
│  ├─ components/              # Reusable components
│  │  ├─ auth/                 # Auth-related
│  │  │  ├─ LoginForm.tsx
│  │  │  ├─ LogoutButton.tsx
│  │  │  └─ AuthGuard.tsx
│  │  ├─ common/               # Shared components
│  │  │  ├─ Navbar.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  ├─ Header.tsx
│  │  │  └─ Footer.tsx
│  │  ├─ superadmin/           # Admin-only components
│  │  │  ├─ UserManagement.tsx
│  │  │  ├─ DepartmentManager.tsx
│  │  │  └─ SystemStats.tsx
│  │  ├─ ui/                   # Base UI components
│  │  │  ├─ Button.tsx
│  │  │  ├─ Card.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Input.tsx
│  │  │  └─ Table.tsx
│  │  └─ widgets/              # Specialized components
│  │     ├─ TaskCard.tsx
│  │     ├─ DTRForm.tsx
│  │     ├─ NotificationBell.tsx
│  │     └─ ProfileCard.tsx
│  │
│  ├─ features/                # Feature modules
│  │  ├─ auth/                 # Authentication feature
│  │  ├─ dashboard/            # Dashboard feature
│  │  ├─ tasks/                # Task management
│  │  ├─ dtr/                  # Time tracking
│  │  ├─ notifications/        # Notifications
│  │  ├─ profile/              # User profile
│  │  ├─ activityLogs/         # Activity logs
│  │  └─ superadmin/           # Admin features
│  │
│  ├─ layouts/                 # Page layouts
│  │  ├─ AuthLayout.astro      # For login/auth pages
│  │  └─ DashboardLayout.astro # For authenticated pages
│  │
│  ├─ store/                   # Zustand stores
│  │  ├─ authStore.ts          # Auth state
│  │  ├─ taskStore.ts          # Tasks state
│  │  ├─ dtrStore.ts           # DTR state
│  │  ├─ notificationStore.ts  # Notifications
│  │  ├─ uiStore.ts            # UI state
│  │  └─ realtimeStore.ts      # Real-time updates
│  │
│  ├─ services/                # API communication
│  │  ├─ api.ts                # Axios instance
│  │  ├─ authService.ts        # Auth endpoints
│  │  ├─ taskService.ts        # Task endpoints
│  │  ├─ dtrService.ts         # DTR endpoints
│  │  ├─ userService.ts        # User endpoints
│  │  └─ notificationService.ts
│  │
│  ├─ hooks/                   # Custom React hooks
│  │  ├─ useAuth.ts            # Auth hook
│  │  ├─ useTasks.ts           # Tasks hook
│  │  ├─ useDTR.ts             # DTR hook
│  │  ├─ useNotifications.ts   # Notifications hook
│  │  ├─ useWindowSize.ts      # Window size hook
│  │  └─ useSocket.ts          # Socket.io hook
│  │
│  ├─ types/                   # TypeScript types
│  │  ├─ index.ts              # Type definitions
│  │  └─ api.ts                # API response types
│  │
│  ├─ utils/                   # Utility functions
│  │  ├─ roleRoutes.ts         # Role-based routing
│  │  ├─ utils.ts              # Common helpers
│  │  ├─ dateFormatter.ts      # Date/time helpers
│  │  └─ validation.ts         # Input validation
│  │
│  ├─ styles/                  # Global styles
│  │  └─ globals.css           # Tailwind + custom CSS
│  │
│  ├─ config/                  # Configuration
│  │  └─ env.ts                # Environment config
│  │
│  └─ vite-env.d.ts            # Vite types
│
├─ public/                     # Static assets
├─ astro.config.mjs            # Astro configuration
├─ tsconfig.json               # TypeScript config
├─ tailwind.config.mjs         # Tailwind config
└─ package.json
```

## Key Concepts

### Pages vs Features

- **Pages** (`/pages`): Astro pages that define routes
- **Features** (`/features`): Business logic and feature-specific components

Example:
```
pages/tasks.astro
  ↓ (imports)
features/tasks/TasksPage.tsx
  ↓ (contains)
components/widgets/TaskCard.tsx
  ↓ (uses)
store/taskStore.ts
```

### State Management (Zustand)

Stores manage global application state:

```typescript
// authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(email, password);
      set({ 
        user: response.user, 
        token: response.token,
        isLoading: false
      });
      localStorage.setItem('token', response.token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
  
  setUser: (user) => set({ user })
}));

export default useAuthStore;
```

### API Communication

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Custom Hooks

Hooks encapsulate reusable logic:

```typescript
// hooks/useTasks.ts
import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { taskService } from '../services/taskService';

export const useTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskService.listTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  return { tasks, isLoading, error, refetch: fetchTasks };
};
```

### Real-time Socket Integration

```typescript
// hooks/useSocket.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useRealtimeStore } from '../store/realtimeStore';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const updateTask = useRealtimeStore((state) => state.updateTask);
  const addNotification = useRealtimeStore((state) => state.addNotification);
  
  useEffect(() => {
    if (!token) return;
    
    const socket = io(import.meta.env.PUBLIC_API_URL, {
      auth: { token }
    });
    
    socket.on('task-updated', (data) => {
      updateTask(data);
    });
    
    socket.on('notification-received', (notification) => {
      addNotification(notification);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [token]);
};
```

## Component Examples

### Protected Route Component

```typescript
// components/auth/AuthGuard.tsx
import { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuthGuardProps {
  requiredRole?: 'Admin' | 'Superadmin' | 'Standard_User';
  children: ReactNode;
}

export const AuthGuard = ({ requiredRole, children }: AuthGuardProps) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  if (requiredRole && user.global_role !== requiredRole) {
    return <div>You don't have permission to view this content</div>;
  }
  
  return <>{children}</>;
};
```

### Task Card Component

```typescript
// components/widgets/TaskCard.tsx
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskCard = ({ task, onUpdate }: TaskCardProps) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold">{task.title}</h3>
      <p className="text-gray-600">{task.description}</p>
      
      <div className="flex justify-between items-center mt-4">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        
        <select
          value={task.status}
          onChange={(e) => onUpdate({ ...task, status: e.target.value })}
          className="select select-sm"
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Under Review</option>
          <option>Completed</option>
        </select>
      </div>
    </div>
  );
};
```

## Data Flow

```
User Action (UI)
    ↓
React Component Event Handler
    ↓
Zustand Store / Custom Hook
    ↓
API Service (Axios)
    ↓
Backend API (Express)
    ↓
Response
    ↓
Store Update
    ↓
Component Re-render
```

## Real-time Flow

```
Backend Service creates/updates entity
    ↓
Socket.io emits event
    ↓
Frontend Socket Listener receives event
    ↓
Update Zustand Store
    ↓
Components using store re-render
    ↓
UI updates instantly
```

## Authentication Flow

```
1. User enters email/password
2. LoginForm submits to authService
3. authService calls POST /api/auth/login
4. Backend returns JWT + user data
5. authStore saves token and user
6. localStorage persists token
7. Redirect to dashboard
8. authMiddleware on routes checks authStore
```

## Best Practices

1. **Keep stores focused** - One responsibility per store
2. **Use hooks for logic** - Custom hooks for reusable logic
3. **Lazy load heavy components** - Use React.lazy() for admin features
4. **Cache API responses** - Reduce unnecessary API calls
5. **Type everything** - Use TypeScript interfaces for API responses
6. **Handle loading states** - Show spinners/skeletons
7. **Error boundaries** - Catch and handle errors gracefully

---

**Recommendation**: Read about [Frontend Features](./features.md) or see [Components](./components.md)
