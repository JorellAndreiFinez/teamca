---
title: System Architecture Overview
description: High-level overview of the TeamCA system's architecture
---

## High-Level Architecture

TeamCA follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├──────────────────────────┬──────────────────────────────────┤
│   Frontend (Astro/React) │    Website (Astro)              │
│   Internal Dashboard     │    Public Information            │
└──────────────┬───────────┴──────────────────────┬───────────┘
               │                                  │
       ────────┴──────────────┬───────────────────┴────────
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                      API LAYER                             │
│          (Express.js + TypeScript + Socket.io)            │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Models → Database       │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────────┐
│                   DATA LAYER                               │
│             (MongoDB + Mongoose)                           │
└────────────────────────────────────────────────────────────┘
```

## Request Flow

### Backend Request Lifecycle

```
HTTP Request
    ↓
Routes (index.ts) - Route matching
    ↓
Middlewares - Auth, RBAC, rate limiting, logging
    ↓
Controllers - Extract request data
    ↓
Services - Business logic
    ↓
Models - Database operations
    ↓
Response → JSON
```

### Example: Create Task

```
POST /api/tasks
    ↓
taskRoutes → taskController.createTask()
    ↓
authMiddleware (verify JWT)
    ↓
rbac middleware (check permissions)
    ↓
taskService.createTask(taskData, userId)
    ↓
Task model → MongoDB
    ↓
200 Created { id, title, status, ... }
```

## Frontend Request Flow

```
User Action (UI)
    ↓
React Component Event Handler
    ↓
Zustand Store Dispatch / API Call
    ↓
Axios → Backend API
    ↓
Response → Store Update
    ↓
UI Re-render
```

## Real-Time Communication

WebSocket connection for real-time features:

```
Frontend (socket.io-client)
    ↕ (WebSocket)
Backend Socket Server (socket.io)
    ↓
Services emit events
    ↓
All connected clients receive update
```

## Core Modules

| Module | Purpose | Components |
|--------|---------|-----------|
| **Auth** | User authentication & JWT | authController, authService, authMiddleware |
| **Tasks** | Task creation & management | taskController, taskService, Task model |
| **DTR** | Daily time record tracking | dtrController, dtrService, DTR model |
| **Notifications** | Real-time alerts | notificationController, Socket.io |
| **Users** | User management | userController, userService, User model |
| **Departments** | Department organization | departmentController, departmentService |
| **Activity Logs** | Audit trail | activityLogger middleware, ActivityLog model |

## Key Architectural Decisions

### 1. **MVC Pattern**
- Clear separation between routing, business logic, and data access
- Controllers handle HTTP, Services handle logic, Models handle data

### 2. **Middleware Chain**
- Multiple middleware layers for authentication, authorization, logging
- Order matters: auth → rbac → route handler

### 3. **WebSocket Integration**
- Socket.io for real-time notifications and updates
- Authenticated socket connections using JWT
- Namespace-based event organization

### 4. **Role-Based Access Control (RBAC)**
- Global roles: Superadmin, Admin, Standard_User
- Department roles: Head, Supervisor, Intern
- Fine-grained permission checks in both backend and frontend

### 5. **Service Layer**
- Encapsulates business logic
- Reusable across controllers
- Handles data transformation and validation

## Data Flow Example: Update Task Status

```
1. Frontend sends: PATCH /api/tasks/:id { status: "In Progress" }

2. Backend:
   - Route matches taskRoutes
   - authMiddleware verifies JWT
   - rbac.requireGlobalRole middleware checks permissions
   - taskController.updateTask() called
   
3. Service Layer:
   - taskService.updateTask() validates input
   - Checks if user owns task or has permission
   - Updates Task model
   - Creates TaskStatusHistory record
   - Emits socket event to all connected clients
   
4. Database:
   - Task document updated
   - TaskStatusHistory created
   
5. Frontend:
   - Socket receives task-updated event
   - Zustand store updates
   - UI re-renders with new status

6. Response sent: 200 { id, status, updated_at, ... }
```

## Security Layers

1. **CORS** - Restricted to configured origins
2. **Helmet** - HTTP headers security
3. **Rate Limiting** - Prevent abuse (important when scaling)
4. **JWT Authentication** - User identity verification
5. **RBAC Middleware** - Role-based authorization
6. **Input Validation** - Zod schema validation
7. **Password Hashing** - bcryptjs for password security

## Scalability Considerations

- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Database**: MongoDB supports sharding for large datasets
- **WebSockets**: Socket.io can be deployed with Redis adapter for multi-server sync
- **Caching**: Can add Redis for session/data caching
- **CDN**: Static assets and public website can be cached globally

---

**Recommendation**: Dive into [Backend Architecture](../backend/overview) or [Frontend Architecture](../frontend/overview)
