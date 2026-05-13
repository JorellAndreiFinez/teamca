---
title: Dashboard Module
description: Main dashboard interface and overview analytics
---

The Dashboard module provides a unified overview of key metrics, recent activities, and quick access to important features.

## Overview

**Purpose**: Display personalized dashboard with relevant data for each role

**What's shown**:
- Task statistics and quick actions
- Time tracking summary (DTR)
- Recent activity feed
- Performance metrics
- Notifications and alerts
- Quick navigation to key features

## System Architecture

### Key Files

**Backend** | Location
---|---
Controller (if needed) | `backend/src/controllers/` (uses existing)
Services | Uses taskService, dtrService, activityService
Routes | Aggregates from other routes

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/dashboard/`
Components | `frontend/src/features/dashboard/components/`
Page | `frontend/src/pages/index.astro`

## Dashboard Components

### Page Structure

```
Dashboard Page
├── Header
│   ├── User greeting
│   ├── Current date/time
│   └── Quick actions
├── Stats Row
│   ├── Total Tasks Widget
│   ├── Pending Tasks Widget
│   ├── Hours Logged Widget
│   └── Performance Score Widget
├── Main Content
│   ├── Recent Tasks Section
│   │   └── TaskList (recent 5)
│   ├── Time Tracking
│   │   └── DTR Summary
│   └── Activity Timeline
│       └── ActivityFeed (recent 10)
└── Sidebar
    ├── Notifications Panel
    ├── Quick Links
    └── Profile Card
```

### Component Breakdown

| Component | Purpose |
|---|---|
| `StatsWidget` | Display KPI metric with number, label, trend |
| `TaskWidget` | List of assigned tasks |
| `DTRWidget` | Time tracking summary |
| `ActivityWidget` | Recent user actions |
| `NotificationPanel` | Unread notifications |
| `QuickActions` | Common tasks (New Task, Log Time, etc.) |

## Data Flow

### Dashboard Load Sequence

```
User navigates to /
    ↓
DashboardPage.astro mounts
    ↓
useEffect triggers dashboardStore initialization
    ↓
Load all data in parallel:
├─ GET /api/tasks/summary
├─ GET /api/dtr/summary
├─ GET /api/activity/recent
└─ GET /api/notifications/unread
    ↓
Store updates with results
    ↓
Components subscribe to store
    ↓
Re-render with actual data
```

### Real-time Updates

Dashboard uses Socket.io for live updates:

```typescript
// In dashboard store or component
socket.on('task-updated', (task) => {
  // Update tasks widget
  updateTaskInDashboard(task);
});

socket.on('notification', (notification) => {
  // Update notification count
  addNotificationToDashboard(notification);
});
```

## Role-Specific Dashboards

### Intern Dashboard
- Assigned tasks
- Time logging
- Feedback received
- Activity log
- Notifications

### Admin Dashboard
- Department tasks
- Team performance
- Time reports by member
- Activity audit
- System stats

### Superadmin Dashboard
- System overview
- All tasks
- All users active
- Performance metrics
- System alerts

## Store Structure

```typescript
interface DashboardState {
  // Stats
  stats: {
    totalTasks: number;
    assignedTasks: number;
    completedTasks: number;
    hoursLogged: number;
    performanceScore: number;
  };

  // Data
  recentTasks: Task[];
  recentActivity: ActivityLog[];
  unreadNotifications: Notification[];

  // UI
  loading: boolean;
  error: string | null;

  // Actions
  loadDashboard: () => Promise<void>;
  refreshStats: () => Promise<void>;
}
```

## Real-time Socket.io Events

```typescript
// Subscribe to dashboard updates
socket.on('task-assigned', () => {
  // Refresh tasks widget
});

socket.on('task-completed', () => {
  // Update stats
});

socket.on('notification', (notification) => {
  // Add to notifications panel
});
```

## Performance Optimization

### Data Caching
```typescript
// Cache dashboard data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const loadDashboard = async () => {
  const cached = dashboardStore.getCached();
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Fetch fresh data
  const data = await fetchAllDashboardData();
  dashboardStore.setCached(data);
  return data;
};
```

### Lazy Loading
- Skeleton loaders while data loads
- Load widgets asynchronously
- Prioritize above-fold content

## Customization

Users can:
- Rearrange widgets
- Hide/show widgets
- Set preferred view (grid, list, compact)
- Create custom reports

## Recommendations

| Page | Purpose |
|---|---|
| [Frontend Features](/frontend/features) | Dashboard feature structure |
| [State Management Store](/frontend/store) | Dashboard store patterns |
| [Tasks Module](/modules/tasks) | Task data source |
