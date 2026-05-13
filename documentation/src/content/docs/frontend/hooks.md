---
title: Frontend Hooks
description: React hooks and custom hooks patterns for frontend
---

This guide covers React hooks, custom hooks, and common patterns used throughout the frontend.

## React Built-in Hooks

### State Management

```typescript
// useState - manage component state
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [tasks, setTasks] = useState<Task[]>([]);
```

### Side Effects

```typescript
// useEffect - run side effects (API calls, subscriptions)
useEffect(() => {
  // Run when component mounts
  const loadData = async () => {
    const data = await api.get('/data');
    setData(data);
  };
  loadData();
}, []); // Empty dependency array = run once on mount

// Run when dependencies change
useEffect(() => {
  const handleResize = () => console.log('Window resized');
  window.addEventListener('resize', handleResize);
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Context API

```typescript
// Create context
const ThemeContext = createContext<Theme>('light');

// Provide context
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// Consume context
const theme = useContext(ThemeContext);
```

## Custom Hooks

Custom hooks encapsulate logic for reuse across components.

### useWindowSize

```typescript
// hooks/useWindowSize.ts
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Usage
const { width, height } = useWindowSize();
const isMobile = width < 768;
```

### useAsync

Encapsulates async operations (loading, error, data states):

```typescript
// hooks/useAsync.ts
interface AsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}

export const useAsync = <T,>(
  fn: () => Promise<T>,
  deps: any[] = []
): AsyncState<T> => {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const execute = async () => {
      setState({ status: 'pending', data: null, error: null });
      try {
        const result = await fn();
        if (isMounted) {
          setState({ status: 'success', data: result, error: null });
        }
      } catch (err) {
        if (isMounted) {
          setState({ status: 'error', data: null, error: err });
        }
      }
    };

    execute();

    return () => {
      isMounted = false;
    };
  }, deps);

  return state;
};

// Usage
const { status, data, error } = useAsync(
  () => api.get('/tasks'),
  []
);

if (status === 'pending') return <LoadingSpinner />;
if (status === 'error') return <ErrorAlert error={error} />;
if (status === 'success') return <TaskList tasks={data} />;
```

### useFetch

Simplified data fetching hook:

```typescript
export const useFetch = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// Usage
const { data: tasks, loading, error } = useFetch('/api/tasks');
```

### useLocalStorage

Persist state to localStorage:

```typescript
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(err);
    }
  };

  return [storedValue, setValue];
};

// Usage
const [savedFilters, setSavedFilters] = useLocalStorage('taskFilters', {});
```

### useDebounce

Debounce values for search or filtering:

```typescript
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const searchQuery = useDebounce(inputValue, 300);
useEffect(() => {
  // Only search when user stops typing for 300ms
  searchTasks(searchQuery);
}, [searchQuery]);
```

### useStore (Zustand)

Subscribe to store state:

```typescript
const { tasks, selectedTask, selectTask } = useTaskStore();
```

## Hook Rules

### 1. Call hooks at top level
```typescript
// ✗ Bad: Conditional hook
if (shouldFetch) {
  const data = useFetch('/api/data');
}

// ✓ Good: Always call
const { data } = useFetch('/api/data');
if (shouldFetch) {
  // Use data
}
```

### 2. Only call from React components or custom hooks
```typescript
// ✓ Good
export const MyComponent = () => {
  const data = useFetch('/api/data');
  return <div>{data}</div>;
};

// ✓ Good (custom hook)
export const useCustomHook = () => {
  const data = useFetch('/api/data');
  return data;
};

// ✗ Bad (regular function)
const regularFunction = () => {
  const data = useFetch('/api/data'); // ERROR
};
```

### 3. Specify dependencies correctly
```typescript
// ✓ Good: Empty array = run once
useEffect(() => {
  loadData();
}, []);

// ✓ Good: Update when ID changes
useEffect(() => {
  loadData(id);
}, [id]);

// ✗ Bad: Missing dependency
useEffect(() => {
  loadData(id); // Should have [id] in dependencies
}, []);
```

## Async Patterns

### Loading + Error States
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Data | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await api.get('/data');
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Render
return (
  <div>
    {loading && <Spinner />}
    {error && <Error message={error} />}
    {data && <Content data={data} />}
  </div>
);
```

## Performance Optimization

### useCallback

Memoize functions to prevent unnecessary re-renders:

```typescript
const handleTaskClick = useCallback((taskId: string) => {
  selectTask(taskId);
}, [selectTask]); // Only recreate if selectTask changes

return <TaskList onTaskClick={handleTaskClick} />;
```

### useMemo

Memoize expensive computations:

```typescript
const filteredTasks = useMemo(() => {
  return tasks.filter(t => t.status === filterStatus);
}, [tasks, filterStatus]); // Only recompute when dependencies change
```

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Components](/frontend/components) | Component patterns |
| [State Management Store](/frontend/store) | Zustand store guide |
| [Frontend Features](/frontend/features) | Feature organization |
