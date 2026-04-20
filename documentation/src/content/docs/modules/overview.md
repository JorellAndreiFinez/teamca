---
title: Modules
description: System modules and features
---

Modules are business domains that span both backend and frontend, implementing complete features end-to-end.

## Module Structure

Each module contains:

```
Feature
├── Backend
│   ├── Controller - HTTP request handling
│   ├── Service - Business logic
│   ├── Models - Data schema
│   └── Routes - API endpoints
│
└── Frontend
    ├── Pages - Route pages
    ├── Components - UI components
    ├── Store - State management
    ├── Services - API clients
    └── Hooks - Reusable logic
```

## Available Modules

### 1. Authentication

**Purpose**: User authentication and authorization

**Backend**:
- Controller: `authController.ts` - Login/logout endpoints
- Service: `authService.ts` - JWT validation, password hashing
- Model: `User.ts` - User document
- Routes: `authRoutes.ts` - /auth/* endpoints

**Frontend**:
- Pages: `pages/login.astro` - Login page
- Components: `LoginForm.tsx` - Login form
- Store: `authStore.ts` - Auth state
- Services: `authService.ts` - API calls
- Hooks: `useAuth.ts` - Auth logic

**Key Features**:
- JWT-based authentication
- Password hashing with bcryptjs
- Token refresh mechanism
- Session management
- Auto-logout on token expiry

See detailed [Auth Module](./auth.md)

---

### 2. Task Management

**Purpose**: Create, assign, and track tasks

**Backend**:
- Controller: `taskController.ts`
- Service: `taskService.ts`
- Models: `Task.ts`, `TaskAssignment.ts`, `TaskComment.ts`, `TaskFeedback.ts`, `TaskStatusHistory.ts`, `TaskWorkLink.ts`
- Routes: `taskRoutes.ts`

**Frontend**:
- Pages: `pages/tasks.astro`
- Components: `TaskCard.tsx`, `TaskForm.tsx`
- Store: `taskStore.ts`
- Services: `taskService.ts`
- Hooks: `useTasks.ts`

**Key Features**:
- Task CRUD operations
- Task assignment to users
- Status tracking with history
- Comments and feedback
- Priority and deadline management
- Real-time updates via Socket.io

See detailed [Tasks Module](./tasks.md)

---

### 3. Daily Time Records (DTR)

**Purpose**: Track work hours and attendance

To be filled later once done...

See detailed [DTR Module](./dtr.md)

---

### 4. Notifications

**Purpose**: Real-time alerts and messages

**Backend**:
- Controller: `notificationController.ts`
- Service: `notificationService.ts`
- Model: `Notification.ts`
- Routes: `notificationRoutes.ts`
- Socket.io integration

**Frontend**:
- Pages: `pages/notifications.astro`
- Components: `NotificationBell.tsx`, `NotificationCenter.tsx`
- Store: `notificationStore.ts`
- Services: `notificationService.ts`
- Hooks: `useNotifications.ts`

**Key Features**:
- Real-time notifications via Socket.io
- Mark as read/unread
- Notification types (task, DTR, feedback, etc.)
- Notification expiry
- Notification preferences
- Desktop notifications (optional)

See detailed [Notifications Module](./notifications.md)

---

### 5. User Management

**Purpose**: User CRUD and profile management

**Backend**:
- Controller: `userController.ts`
- Service: `userService.ts`
- Model: `User.ts`
- Routes: `userRoutes.ts`

**Frontend**:
- Pages: `pages/profile.astro`, `pages/superadmin.astro`
- Components: `ProfileCard.tsx`, `UserManagement.tsx`
- Store: `authStore.ts` (extended)
- Services: `userService.ts`

**Key Features**:
- User creation and management
- Profile editing
- Role assignment
- Department assignment
- User deactivation
- Password management
- Working hours configuration

See detailed [User Management Module](./users.md)

---

### 6. Department Management

**Purpose**: Organize users and resources by department

**Backend**:
- Controller: `departmentController.ts`
- Service: `departmentService.ts`
- Model: `Department.ts`
- Routes: `departmentRoutes.ts`

**Frontend**:
- Components: `DepartmentManager.tsx` (admin only)
- Services: `departmentService.ts`

**Key Features**:
- Department CRUD
- Member management
- Department hierarchy
- Role assignment per department
- Department-scoped permissions
- Department reports

See detailed [Departments Module](./departments.md)

---

### 7. Intern Profiles

**Purpose**: Extended profile information for interns

**Backend**:
- Controller: `internProfileController.ts`
- Service: `internProfileService.ts`
- Model: `InternProfile.ts`
- Routes: `internProfileRoutes.ts`

**Frontend**:
- Components: `InternProfileForm.tsx`
- Services: `internProfileService.ts`

**Key Features**:
- School and course information
- Contact person details
- Status tracking (Active, Completed, etc.)
- Internship duration
- Document management (future)

See detailed [Intern Profiles Module](./intern-profiles.md)

---

### 8. Activity Logging

**Purpose**: Audit trail and system monitoring

**Backend**:
- Controller: `activityController.ts`
- Service: `activityService.ts`
- Model: `ActivityLog.ts`
- Middleware: `activityLogger.ts`

**Frontend**:
- Pages: `pages/activity-logs.astro`
- Components: `ActivityLog.tsx`, `ActivityFilter.tsx`

**Key Features**:
- Automatic action logging
- Before/after value tracking
- User action history
- Entity change history
- IP address and user agent logging
- Compliance and audit trails

See detailed [Activity Logs Module](./activity-logs.md)

---

## Data Flow Example: Create and Assign Task

```
Frontend (Task Creation)
  ↓
TaskForm.tsx (React component)
  ↓
taskService.createTask(data)
  ↓ (Axios)
POST /api/tasks
  ↓
Backend taskRoutes
  ↓
taskController.createTask()
  ↓
taskService.createTask(data, userId)
  ├─ Validate input
  ├─ Create Task document
  ├─ Create TaskAssignment records
  ├─ Emit socket event "task-created"
  ├─ Create notifications for assignees
  └─ Log activity "create_task"
  ↓
Task saved to MongoDB
  ↓
Response with created task
  ↓
Frontend taskStore updates
  ↓
taskStore subscribers re-render
  ↓
UI updates with new task
  ↓
Socket event received "task-created"
  ↓
notificationStore adds notification
  ↓
NotificationBell shows badge
```

## Communication Patterns

### REST API (Synchronous)

Used for standard CRUD operations:

```
POST /api/tasks              (create)
GET  /api/tasks              (list)
GET  /api/tasks/:id          (read)
PATCH /api/tasks/:id         (update)
DELETE /api/tasks/:id        (delete)
```

### WebSocket (Real-time)

Used for instant updates:

```
Server → Client: "task-updated"
Server → Client: "notification-received"
Server → Client: "dtr-approved"
```

### Polling (Fallback)

Used when real-time unavailable:

```
Frontend sets interval to check:
GET /api/notifications?unread=true
GET /api/dtr?status=pending
```

## Module Dependencies

```
Authentication
    ↓ (verifies user)
    ├─→ Task Management
    ├─→ DTR
    ├─→ User Management
    ├─→ Department Management
    ├─→ Notifications
    └─→ Activity Logging

Task Management
    ├─→ Notifications (task assigned, status changed)
    ├─→ Activity Logging (track changes)
    ├─→ Intern Profiles (assign to interns)
    └─→ Department Management (scope tasks)

DTR
    ├─→ Notifications (approval, rejection)
    ├─→ Activity Logging (track approvals)
    ├─→ User Management (filter by role)
    └─→ Department Management (scope by dept)

All Modules
    ↓
    Database (MongoDB)
```

---

**Next**: Explore individual modules or learn about [API Endpoints](../api/overview.md)
