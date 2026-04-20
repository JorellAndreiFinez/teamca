---
title: Frontend Components
description: Reusable React components and component architecture
---

The frontend uses **React 18** within **Astro 5** for building interactive dashboard components with a modular, reusable architecture.

## Overview

**Component Types**:
- **UI Components**: Basic building blocks (buttons, forms, cards)
- **Feature Components**: Business logic specific components
- **Layout Components**: Page structure and navigation
- **Page Components**: Astro page wrappers

## Component Architecture

### Directory Structure

```
frontend/src/components/
├── auth/                  # Authentication UI
│   ├── LoginForm.tsx
│   ├── LogoutButton.tsx
│   ├── AuthGuard.tsx
│   └── RoleGuard.tsx
├── common/                # Shared/global components
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── LoadingSpinner.tsx
├── superadmin/           # Admin-only components
│   ├── UserManagement.tsx
│   ├── SystemSettings.tsx
│   └── Reports.tsx
├── ui/                   # Basic UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Form.tsx
│   ├── Modal.tsx
│   ├── Select.tsx
│   ├── Input.tsx
│   └── Table.tsx
└── widgets/              # Dashboard widgets
    ├── TaskWidget.tsx
    ├── StatsWidget.tsx
    └── CalendarWidget.tsx
```

## Component Patterns

### Functional Components with Hooks

```typescript
interface TaskCardProps {
  task: Task;
  onStatusChange: (newStatus: string) => void;
  isEditable: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  isEditable 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await taskService.updateStatus(task._id, newStatus);
      onStatusChange(newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
};
```

### Props & TypeScript

All components use **TypeScript interfaces** for props:

```typescript
// ✓ Good: Explicit typing
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// ✗ Avoid: Any types
const Button = (props: any) => { }
```

## Key UI Components

### Button Component
```typescript
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

### Card Component
```typescript
<Card title="Tasks" footer={<span>5 total</span>}>
  {/* Content */}
</Card>
```

### Form Component
```typescript
<Form onSubmit={handleSubmit}>
  <Input name="title" label="Task Title" required />
  <Select name="status" label="Status" options={statusOptions} />
  <Button type="submit">Save</Button>
</Form>
```

### Table Component
```typescript
<Table
  columns={[
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'deadline', label: 'Deadline' }
  ]}
  data={tasks}
  onRowClick={handleRowClick}
/>
```

## State Management in Components

### Using Zustand Store
```typescript
// In component
const store = useTaskStore();
const tasks = store.tasks;
const addTask = store.addTask;

useEffect(() => {
  // Subscribe to store updates
  const unsubscribe = store.subscribe(...);
  return unsubscribe;
}, [store]);
```

### Lifting State
When components need to share state:
1. Identify common parent
2. Move state to parent
3. Pass state + setter as props
4. Or use Zustand for global state

## Component Composition Patterns

### Compound Components
```typescript
// Parent defines structure
<TaskCard>
  <TaskCard.Header title={task.title} />
  <TaskCard.Body>
    {task.description}
  </TaskCard.Body>
  <TaskCard.Footer actions={actions} />
</TaskCard>
```

### Render Props Pattern
```typescript
<TaskList>
  {(task, isLoading) => (
    <TaskCard task={task} loading={isLoading} />
  )}
</TaskList>
```

## Error Handling in Components

```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (data) => {
  setLoading(true);
  setError(null);
  try {
    await api.create(data);
    // Success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    {error && <ErrorAlert message={error} />}
    {loading && <LoadingSpinner />}
    {/* Component JSX */}
  </>
);
```

## Accessibility (a11y)

All components include:
- **ARIA labels** for screen readers
- **Semantic HTML** (button, form, nav)
- **Keyboard navigation** (Tab, Enter, Escape)
- **Color contrast** WCAG AA compliant
- **Focus management**

## Styling with Tailwind CSS

```typescript
// Use Tailwind classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <Button className="ml-auto">Action</Button>
</div>
```

## Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Hooks](/frontend/hooks) | Custom React hooks |
| [State Management Store](/frontend/store) | Zustand patterns |
| [Frontend Features](/frontend/features) | Feature components |
