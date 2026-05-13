---
title: Notifications Module
description: Real-time notification system for task updates and events
---

The Notifications module delivers real-time alerts to users about important system events using Socket.io WebSockets.

## Overview

**Purpose**: Send real-time notifications for task assignments, status changes, comments, and approvals

**Who receives notifications?**
- **All Roles**: Receive relevant notifications based on role and permissions
- **Customizable**: Users can manage notification preferences

## System Architecture

### Backend Flow

```
Event Trigger (Task created, status changed, etc.)
    ↓
notificationController / notificationService
    ↓
Notification Model saved to DB
    ↓
Socket.io broadcasts to user room
    ↓
Frontend receives and displays
```

### Key Files

**Backend** | Location
---|---
Controller | `backend/src/controllers/notificationController.ts`
Service | `backend/src/services/notificationService.ts`
Model | `backend/src/models/Notification.ts`
Routes | `backend/src/routes/notificationRoutes.ts`
Socket Setup | `backend/src/socket/io.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/notifications/`
Components | `frontend/src/features/notifications/components/`

## Core Functionality

### Notification Types

| Event | Trigger | Recipients |
|---|---|---|
| Task Assignment | Task assigned to user | Assigned user |
| Task Status Change | Status updated | Task creator, admins |
| Comment Added | Comment posted on task | Task assignees |
| Feedback Received | Feedback given | Feedback recipient |
| Approval Needed | Task submitted for review | Approvers |
| Approval Complete | Task approved/rejected | Original creator |

### Notification Delivery

1. **Persistent**: Stored in MongoDB
2. **Real-time**: Sent via Socket.io WebSocket
3. **Queued**: Handled asynchronously via service
4. **Delivered**: Marked as read when viewed

## Data Model

### Notification Schema
```typescript
{
  _id: ObjectId
  recipient: ObjectId (user)
  type: string (task-assigned, status-changed, etc.)
  title: string
  message: string
  relatedResource: {
    resourceType: string (task, comment, etc.)
    resourceId: ObjectId
  }
  isRead: boolean
  createdAt: Date
  readAt: Date (optional)
}
```

## Frontend Implementation

### Components
```
features/notifications/
├── components/
│   ├── NotificationBell.tsx
│   ├── NotificationDropdown.tsx
│   ├── NotificationItem.tsx
│   └── NotificationCenter.tsx
└── store/
    └── notificationStore.ts
```

### Real-time Socket.io Connection

```typescript
// Client listens for:
socket.on('notification', (data) => {
  // Add to notification store
  // Update badge count
  // Display toast/alert
});

socket.on('task-assigned', (taskData) => {
  // Create notification
  // Sound/visual alert
});
```

## Recommendations

| Page | Purpose |
|---|---|
| [Tasks Module](/modules/tasks) | Primary notification source |
| [Backend Socket.io](/backend/socket) | Real-time communication |
| [Activity Logs Module](/modules/activity-logs) | Notification audit trail |
