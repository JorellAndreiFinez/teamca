---
title: API Usage & Services
description: How to call backend API from frontend and service patterns
---

# API Usage & Services

The frontend communicates with the backend through HTTP requests using a centralized API service layer.

## API Base Configuration

### Environment Variables

```typescript
// src/config/env.ts
export const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds
```

### API Service Setup

```typescript
// lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to every request
    this.client.interceptors.request.use((config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          useAuthStore.getState().logout();
        }
        throw error;
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
```

## Service Pattern

### Task Service Example

```typescript
// services/taskService.ts
import { api } from '@/lib/api';
import type { Task, TaskFilter } from '@/types';

export const taskService = {
  /**
   * Get all tasks with optional filters
   */
  getAll: async (filters?: TaskFilter) => {
    const { data } = await api.get('/api/tasks', {
      params: filters
    });
    return data.data;
  },

  /**
   * Get single task by ID
   */
  getById: async (id: string) => {
    const { data } = await api.get(`/api/tasks/${id}`);
    return data.data;
  },

  /**
   * Create new task
   */
  create: async (taskData: Partial<Task>) => {
    const { data } = await api.post('/api/tasks', taskData);
    return data.data;
  },

  /**
   * Update existing task
   */
  update: async (id: string, updates: Partial<Task>) => {
    const { data } = await api.put(`/api/tasks/${id}`, updates);
    return data.data;
  },

  /**
   * Delete task
   */
  delete: async (id: string) => {
    await api.delete(`/api/tasks/${id}`);
  },

  /**
   * Update task status
   */
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.put(`/api/tasks/${id}`, { status });
    return data.data;
  },

  /**
   * Assign task to user
   */
  assign: async (id: string, userId: string) => {
    const { data } = await api.post(`/api/tasks/${id}/assign`, { userId });
    return data.data;
  },

  /**
   * Add comment to task
   */
  addComment: async (id: string, comment: string) => {
    const { data } = await api.post(`/api/tasks/${id}/comments`, { comment });
    return data.data;
  },

  /**
   * Get task statistics
   */
  getStats: async () => {
    const { data } = await api.get('/api/tasks/stats');
    return data.data;
  }
};
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "_id": "123",
    "title": "Task title",
    // ... other fields
  },
  "message": "Task created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

## Error Handling

### Try-Catch Pattern
```typescript
const handleCreateTask = async (taskData) => {
  setLoading(true);
  setError(null);
  try {
    const task = await taskService.create(taskData);
    setTasks([...tasks, task]);
  } catch (err) {
    const message = err.response?.data?.error?.message || 'Failed to create task';
    setError(message);
  } finally {
    setLoading(false);
  }
};
```

### Axios Error Handling
```typescript
try {
  await taskService.delete(taskId);
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle axios errors
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message);
  } else {
    // Handle non-axios errors
    console.error('Unknown error:', error);
  }
}
```

## Authentication Handling

### Login Service
```typescript
export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    
    // Store token
    const { token, user } = data.data;
    localStorage.setItem('authToken', token);
    
    return { token, user };
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/api/auth/me');
    return data.data;
  },

  refreshToken: async () => {
    const { data } = await api.post('/api/auth/refresh');
    const token = data.data.token;
    localStorage.setItem('authToken', token);
    return token;
  }
};
```

## File Upload

### Upload Files
```typescript
export const uploadFile = async (file: File, path: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/api/upload${path}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return data.data.url;
};

// Usage
const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      const photoUrl = await uploadFile(file, '/profile-photo');
      await profileService.updatePhoto(photoUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }
};
```

## Pagination

### Paginated Requests
```typescript
export const taskService = {
  getPaginated: async (page: number = 1, pageSize: number = 20) => {
    const { data } = await api.get('/api/tasks', {
      params: { page, pageSize }
    });

    return {
      items: data.data,
      pagination: data.pagination // { page, pageSize, total, totalPages }
    };
  }
};

// Usage
const [page, setPage] = useState(1);
const { items: tasks, pagination } = await taskService.getPaginated(page);

const handleNextPage = () => {
  setPage(page + 1);
};
```

## Query Parameters

### Building Query Strings
```typescript
const fetchFilteredTasks = async (filters: TaskFilter) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.set('status', filters.status);
  if (filters.assignee) params.set('assignee', filters.assignee);
  if (filters.searchQuery) params.set('search', filters.searchQuery);

  const { data } = await api.get(`/api/tasks?${params.toString()}`);
  return data.data;
};
```

## Caching

### Simple Cache
```typescript
const cache = new Map<string, any>();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const taskService = {
  getAll: async (useCache = true) => {
    const cacheKey = 'tasks-all';
    const cached = cache.get(cacheKey);

    if (useCache && cached && Date.now() - cached.timestamp < CACHE_TIME) {
      return cached.data;
    }

    const data = await api.get('/api/tasks');
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  invalidateCache: () => {
    cache.clear();
  }
};
```

## Rate Limiting

API enforces rate limits:
- **Public endpoints**: 100 requests/minute
- **Authenticated endpoints**: 1000 requests/minute

On rate limit (429 response):
```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'];
  console.warn(`Rate limited. Retry after ${retryAfter}s`);
}
```

## Recommendations

| Page | Purpose |
|---|---|
| [Backend Services](/backend/services) | Server-side implementation |
| [Frontend Features](/frontend/features) | Feature service integration |
| [Frontend Hooks](/frontend/hooks) | useAsync and useFetch patterns |
