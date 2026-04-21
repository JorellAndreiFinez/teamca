---
title: Superadmin Module
description: System administration and user management features
---

The Superadmin module provides comprehensive system administration capabilities, user management, and system-wide configuration.

## Overview

**Purpose**: Administrative functions accessible only to superadmins

**Key Capabilities**:
- User management (create, edit, delete, roles)
- Department management
- System configuration
- Reports and analytics
- Audit logs review
- System health monitoring

**Access**: SUPERADMIN role only

## System Architecture

### Backend Integration

This module primarily uses existing controllers and services with superadmin-only authorization checks:

| Resource | Controller | Service |
|---|---|---|
| Users | userController | userService |
| Departments | departmentController | departmentService |
| Activity Logs | activityController | activityService |
| Tasks | taskController | taskService |

### Key Files

**Backend** | Location
---|---
User Controller | `backend/src/controllers/userController.ts`
User Service | `backend/src/services/userService.ts`
Department Controller | `backend/src/controllers/departmentController.ts`
Activity Controller | `backend/src/controllers/activityController.ts`
RBAC Middleware | `backend/src/middlewares/rbac.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/superadmin/`
Components | `frontend/src/features/superadmin/components/`

## Core Features

### User Management

#### List Users
```
GET /api/users
Query params:
- role: Filter by role
- department: Filter by department
- status: active/inactive
- search: Search by name/email
- page: Pagination
```

**Response**:
```json
{
  "data": [
    {
      "_id": "xxx",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "globalRole": "ADMIN",
      "departments": [{"department": "xxx", "role": "ADMIN"}],
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

#### Create User
```
POST /api/users
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "globalRole": "ADMIN",
  "departments": [
    {
      "department": "dept_id",
      "role": "ADMIN"
    }
  ]
}
```

#### Update User
```
PUT /api/users/:id
{
  "firstName": "Updated",
  "globalRole": "USER",
  "departments": [...]
}
```

#### Delete User
```
DELETE /api/users/:id
```

### Department Management

#### List Departments
```
GET /api/departments
```

#### Create Department
```
POST /api/departments
{
  "name": "Engineering",
  "description": "Engineering department"
}
```

#### Update Department
```
PUT /api/departments/:id
{
  "name": "Updated Name"
}
```

### Reports & Analytics

#### User Reports
```
GET /api/reports/users
Query:
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD
- department: filter by dept

Returns:
- Active user count
- Users by role distribution
- New users this period
- Inactive users
```

#### Activity Reports
```
GET /api/reports/activity
Query:
- startDate
- endDate
- action: Filter by action type
- resourceType: TASK, USER, COMMENT

Returns:
- Activity by type
- Activity by department
- Most active users
- Timeline data
```

#### Task Reports
```
GET /api/reports/tasks
Returns:
- Tasks by status
- Task completion rate
- Avg task duration
- Tasks by assignee
- Overdue tasks
```

## Frontend Implementation

### Components Structure

```
features/superadmin/
├── components/
│   ├── UserManagement/
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   ├── UserRoles.tsx
│   │   ├── BulkUserActions.tsx
│   │   └── UserSearch.tsx
│   ├── DepartmentManagement/
│   │   ├── DepartmentList.tsx
│   │   ├── DepartmentForm.tsx
│   │   └── DepartmentMembers.tsx
│   ├── Reports/
│   │   ├── UserReport.tsx
│   │   ├── ActivityReport.tsx
│   │   ├── TaskReport.tsx
│   │   └── ReportGenerator.tsx
│   ├── SystemSettings/
│   │   ├── Settings.tsx
│   │   ├── ConfigForm.tsx
│   │   └── FeatureFlags.tsx
│   └── AuditLog/
│       ├── AuditViewer.tsx
│       └── AuditFilter.tsx
├── pages/
│   ├── admin.astro
│   ├── users.astro
│   ├── departments.astro
│   ├── reports.astro
│   └── settings.astro
└── store/
    └── adminStore.ts
```

### Admin Navigation

```
Admin Menu
├── Dashboard
├── Users
│   ├── List Users
│   ├── Create User
│   └── Manage Roles
├── Departments
│   ├── List Departments
│   └── Manage Members
├── Reports
│   ├── User Activity
│   ├── Task Analytics
│   └── Time Reports
├── Audit
│   └── Activity Logs
└── Settings
    ├── System Config
    └── Feature Flags
```

## Store Pattern

```typescript
interface AdminState {
  // Lists
  users: User[];
  departments: Department[];
  activityLogs: ActivityLog[];

  // Filters
  userFilter: {
    role?: string;
    department?: string;
    search?: string;
  };

  // UI
  loading: boolean;
  error: string | null;

  // Actions
  loadUsers: (filters?: any) => Promise<void>;
  createUser: (user: UserData) => Promise<void>;
  updateUser: (id: string, updates: UserData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  loadDepartments: () => Promise<void>;
  createDepartment: (dept: DeptData) => Promise<void>;

  generateReport: (type: string, params: any) => Promise<Report>;
}

export const useAdminStore = create<AdminState>((set) => ({
  // ... implementation
}));
```

## Authorization Rules

**Superadmin Only Operations**:
- ✓ Create/edit any user
- ✓ Delete user accounts
- ✓ Change global roles
- ✓ Create departments
- ✓ View all activity logs
- ✓ Generate system reports
- ✓ Configure system settings
- ✓ Reset user passwords

**Cannot Do**:
- ✗ Change own global role (prevent lockout)
- ✗ Delete own account
- ✗ Modify superadmin status without verification

## Security Considerations

### Rate Limiting
- Admin endpoints rate-limited to prevent abuse
- Bulk operations logged for audit

### Audit Trail
- All admin actions logged in ActivityLog
- Includes: who, what, when, why
- Cannot be deleted by admin

### Password Reset
- Temporary password sent via email
- User must change on first login
- Only superadmin can initiate

## Recommendations

| Page | Purpose |
|---|---|
| [Roles & Access Control](/roles/overview) | Permission model |
| [Activity Logs Module](/modules/activity-logs) | Audit trail details |
| [Authentication Module](/modules/auth) | User creation flow |
