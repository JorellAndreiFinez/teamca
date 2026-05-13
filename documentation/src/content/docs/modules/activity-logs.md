---
title: Activity Logs Module
description: Audit trail system tracking all user actions and system changes
---

The Activity Logs module provides a complete audit trail of all user actions and system changes for compliance and debugging.

## Overview

**Purpose**: Log every significant action for audit, debugging, and compliance purposes

**Tracked Events**:
- Task creation, modification, deletion
- Status changes
- User actions (login, logout)
- Comments and feedback
- Time record entries
- Role/permission changes
- System configuration changes

## System Architecture

### Key Files

**Backend** | Location
---|---
Controller | `backend/src/controllers/activityController.ts`
Service | `backend/src/services/activityService.ts`
Model | `backend/src/models/ActivityLog.ts`
Middleware | `backend/src/middlewares/activityLogger.ts`
Routes | `backend/src/routes/activityRoutes.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/activityLogs/`
Components | `frontend/src/features/activityLogs/components/`

## How It Works

### Automatic Logging

Every significant API call triggers logging:

```
API Request
    ↓
Execute action (create task, update status, etc.)
    ↓
On success:
    ├─ ActivityLog record created
    ├─ User ID logged
    ├─ Timestamp recorded
    ├─ Action type captured
    ├─ Resource ID stored
    └─ Changes documented
    ↓
Response sent to client
```

### Logged Information

```typescript
{
  _id: ObjectId,
  user: ObjectId (who performed action),
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT",
  resourceType: "TASK" | "COMMENT" | "DTR" | "USER" | etc.,
  resourceId: ObjectId,
  department: ObjectId,
  before: { /* previous state */ },
  after: { /* new state */ },
  details: "Human readable description",
  ipAddress: string,
  userAgent: string,
  timestamp: Date
}
```

## Data Model

### ActivityLog Schema
```typescript
interface ActivityLog {
  _id: ObjectId;
  user: ObjectId;          // Who did it
  action: string;          // CREATE, UPDATE, DELETE, LOGIN, etc.
  resourceType: string;    // TASK, USER, COMMENT, DTR, etc.
  resourceId: ObjectId;    // Which specific item
  department: ObjectId;    // Department context
  before?: any;            // Previous values
  after?: any;             // New values
  details: string;         // Human description
  ipAddress: string;       // Where from
  userAgent: string;       // Browser/client info
  createdAt: Date;
}
```

## Viewing Activity Logs

### Access Control

| Role | Can View |
|---|---|
| Superadmin | All activity logs |
| Admin | Logs for their department |
| User | Own activity (limited) |

### Frontend Features

```
features/activityLogs/
├── components/
│   ├── ActivityLog.tsx
│   ├── ActivityFilter.tsx
│   ├── ActivityTimeline.tsx
│   └── ActivityDetail.tsx
├── pages/
│   └── ActivityLogsPage.astro
└── store/
    └── activityStore.ts
```

### Filtering & Search

Users can filter by:
- **Date Range**: From/to dates
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN
- **Resource Type**: TASK, USER, COMMENT, DTR
- **User**: Who performed action
- **Department**: Filter by department

## Use Cases

### Compliance & Auditing
- Track who modified what and when
- Export logs for compliance reports
- Investigate data changes

### Debugging
- Trace user actions leading to error
- Understand application flow
- Identify problematic operations

### Security Monitoring
- Suspicious login attempts
- Unusual bulk operations
- Unauthorized access attempts

## Retention Policy

Activity logs are kept for **12 months** by default. Older entries can be archived or deleted based on compliance requirements.

## Recommendations

| Page | Purpose |
|---|---|
| [Tasks Module](/modules/tasks) | What gets logged |
| [Roles & Access Control](/roles/overview) | Who can see what |
| [Backend Services](/backend/services) | How logging works |
