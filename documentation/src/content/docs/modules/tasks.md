---
title: Tasks Module
description: Complete guide to the Tasks management system's core feature for assigning and tracking work
---

The Tasks module is the **core feature** of TeamCA, enabling administrators and superadmins to assign work to interns, track progress, and manage deadlines.

## Overview

**Purpose**: Facilitate task creation, assignment, tracking, and completion with role-based access control

**Who can access?**
- **Superadmin**: Create, assign, modify, delete tasks globally
- **Admin**: Create and manage tasks within their department
- **Standard User**: View and update assigned tasks

## System Architecture

### Backend Flow

```
User Request
    ↓
taskController (HTTP handler)
    ↓
taskService (business logic)
    ↓
Task Model (MongoDB schema)
    ↓
Database
```

### Key Files

**Backend** | Location
---|---
Controller | `backend/src/controllers/taskController.ts`
Service | `backend/src/services/taskService.ts`
Model | `backend/src/models/Task.ts`
Routes | `backend/src/routes/taskRoutes.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/tasks/`
Components | `frontend/src/features/tasks/components/`
Store | `frontend/src/store/` (Zustand)
API Service | `frontend/src/services/` (Axios client)

## Core Functionality

### Task Creation
- **Who**: Superadmin, Admin
- **Fields**: Title, Description, Deadline, Assignee, Priority
- **Validation**: Required fields, date validation
- **Flow**: 
  1. Frontend form submission
  2. API POST to `/api/tasks`
  3. Service validates and saves
  4. Real-time notification via Socket.io

### Task Assignment
- **Assign to**: Individual users or groups
- **Permissions**: Based on department access
- **Notification**: Assignee receives Socket.io event

### Task Status Tracking
- **States**: Created → In Progress → In Review → Completed → Closed
- **History**: TaskStatusHistory model tracks state changes
- **Audit**: All status changes logged in ActivityLog

### Task Comments & Feedback
- **Model**: TaskComment, TaskFeedback
- **Real-time**: Socket.io events for new comments
- **Access**: Role-based visibility

## Data Models

### Task Model
```typescript
{
  _id: ObjectId
  title: string
  description: string
  assignedTo: ObjectId[] (user references)
  createdBy: ObjectId (creator)
  department: ObjectId
  deadline: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'CREATED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED'
  workLinks: ObjectId[] (related work)
  createdAt: Date
  updatedAt: Date
}
```

### Related Models
- **TaskAssignment**: Tracks individual assignments
- **TaskComment**: Comments on tasks
- **TaskFeedback**: Feedback from assignees
- **TaskStatusHistory**: Audit trail of status changes
- **TaskWorkLink**: Relationships between tasks

## Frontend Implementation

### Components Structure
```
features/tasks/
├── components/
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   ├── TaskDetail.tsx
│   └── TaskStatus.tsx
├── pages/
│   ├── TasksPage.astro
│   └── TaskDetailPage.astro
├── store/
│   └── taskStore.ts (Zustand)
└── services/
    └── taskService.ts (API calls)
```

### User Flow: Creating a Task

```
Admin opens Tasks page
    ↓
Clicks "Create Task" button
    ↓
Form displays (title, description, assignee, deadline, priority)
    ↓
Admin fills form and submits
    ↓
Frontend validates locally
    ↓
POST /api/tasks with task data
    ↓
Backend validates and saves to MongoDB
    ↓
Socket.io broadcasts update to all connected users
    ↓
Assignee receives notification
    ↓
Task appears in assignee's dashboard
```

### User Flow: Updating Task Status

```
Intern views assigned task
    ↓
Clicks "Start Working"
    ↓
Status changes to IN_PROGRESS
    ↓
PUT /api/tasks/:id with new status
    ↓
TaskStatusHistory record created
    ↓
ActivityLog created
    ↓
Admins notified via Socket.io
```

## State Management (Frontend)

Zustand store manages:
- `tasks[]` - list of all tasks
- `selectedTask` - currently viewing
- `filter` - by status, assignee, priority
- `loading` - API call status
- `error` - error messages

## Real-time Updates

**Socket.io Events**:
- `task-created` - new task published
- `task-updated` - existing task modified
- `task-assigned` - user assigned to task
- `status-changed` - task status updated
- `comment-added` - new comment posted

## Recommendations

Related documentation pages:

| Page | Purpose |
|---|---|
| [Activity Logs Module](/modules/activity-logs) | Understand task audit trails |
| [Roles & Access Control](/roles/overview) | Learn permission boundaries |
| [Backend Services](/backend/services) | Deep dive into service layer |
| [Frontend Features](/frontend/features) | Component architecture patterns |
