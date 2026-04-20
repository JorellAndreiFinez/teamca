---
title: Backend Architecture
description: Backend overview and technology stack
---

## Overview

The backend is built with **Express.js** and **TypeScript**, providing a RESTful API with real-time WebSocket support via Socket.io. It uses **MongoDB** with **Mongoose** for data persistence.

## Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.9
- **Database**: MongoDB 7.x
- **ORM**: Mongoose 9.x
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io 4.8
- **Security**: Helmet, bcryptjs, Rate Limiting
- **Validation**: Zod
- **Development**: ts-node-dev

## Project Structure

```
backend/
├─ src/
│  ├─ index.ts                 # App initialization & server setup
│  ├─ config/
│  │  └─ db.ts                 # MongoDB connection
│  ├─ controllers/             # Request handlers
│  │  ├─ authController.ts
│  │  ├─ userController.ts
│  │  ├─ taskController.ts
│  │  ├─ dtrController.ts
│  │  ├─ departmentController.ts
│  │  ├─ internProfileController.ts
│  │  ├─ notificationController.ts
│  │  └─ activityController.ts
│  ├─ services/                # Business logic
│  │  ├─ authService.ts
│  │  ├─ userService.ts
│  │  ├─ taskService.ts
│  │  ├─ dtrService.ts
│  │  ├─ departmentService.ts
│  │  ├─ internProfileService.ts
│  │  ├─ notificationService.ts
│  │  └─ activityService.ts
│  ├─ models/                  # Mongoose schemas (13 models)
│  │  ├─ User.ts
│  │  ├─ Task.ts
│  │  ├─ DTR.ts
│  │  ├─ Department.ts
│  │  └─ ... (9 more)
│  ├─ routes/                  # Route definitions
│  │  ├─ index.ts              # Route aggregation
│  │  ├─ authRoutes.ts
│  │  ├─ userRoutes.ts
│  │  ├─ taskRoutes.ts
│  │  └─ ... (5 more)
│  ├─ middlewares/             # Express middleware
│  │  ├─ auth.ts               # JWT verification
│  │  ├─ authMiddleware.ts     # Auth header parsing
│  │  ├─ rbac.ts               # Role-based access control
│  │  └─ activityLogger.ts     # Action logging
│  ├─ socket/
│  │  └─ io.ts                 # Socket.io initialization & handlers
│  └─ types/
│     └─ express.d.ts          # Express type augmentation
├─ package.json
├─ tsconfig.json
└─ .env                        # Environment configuration
```

## Request Handling Flow

Every request follows this sequence:

```
1. Express receives request
2. Global middleware (CORS, Helmet, rate limiting)
3. Route matching
4. Route-specific middleware (auth, RBAC)
5. Controller function executes
6. Service method called
7. Model/database operation
8. Response returned
```

## Controllers

Controllers handle HTTP requests and delegate to services.

| Controller | Endpoints | Responsibility |
|---|---|---|
| **authController** | POST /auth/login, /auth/logout | User authentication |
| **userController** | GET /users, POST /users, PATCH /users/:id | User CRUD |
| **taskController** | GET /tasks, POST /tasks, PATCH /tasks/:id | Task management |
| **dtrController** | GET /dtr, POST /dtr, PATCH /dtr/:id | Time tracking |
| **departmentController** | GET /departments, POST /departments | Department CRUD |
| **internProfileController** | GET /profiles, POST /profiles | Intern profile management |
| **notificationController** | GET /notifications, PATCH /notifications/:id | Notification handling |
| **activityController** | GET /activity-logs | Audit trail viewing |

**Key Pattern**:
```typescript
// Controller extracts request data
async createTask(req: Request, res: Response) {
  const { title, description } = req.body;
  const userId = req.user.user_id;
  
  // Delegate to service
  const task = await taskService.createTask({
    title,
    description,
    created_by: userId
  });
  
  res.status(201).json(task);
}
```

## Services

Services encapsulate business logic, validation, and data transformation.

| Service | Key Methods | Responsibility |
|---|---|---|
| **authService** | login(), logout(), refreshToken() | Authentication logic |
| **userService** | createUser(), getUser(), updateUser() | User operations |
| **taskService** | createTask(), updateTask(), listTasks() | Task business logic |
| **dtrService** | recordTime(), approveDTR(), listDTRs() | Time record logic |
| **departmentService** | createDept(), listDepts(), updateDept() | Department operations |
| **internProfileService** | createProfile(), updateProfile() | Intern data handling |
| **notificationService** | createNotification(), markAsRead() | Notification logic |
| **activityService** | logActivity(), getActivityLogs() | Audit logging |

**Key Pattern**:
```typescript
// Service handles business logic
async createTask(taskData: TaskInput, userId: string): Promise<ITask> {
  // Validation
  if (!taskData.title) throw new Error("Title required");
  
  // Business logic
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  // Data transformation
  const task = new Task({
    ...taskData,
    created_by: userId,
    status: "Not Started"
  });
  
  // Persist
  await task.save();
  
  // Side effects (logging, notifications)
  await notificationService.notifyAssignees(task);
  
  return task;
}
```

## Models

Mongoose schemas defining the data structure and validation.

**13 Models**:
1. User
2. Task
3. TaskAssignment
4. TaskComment
5. TaskFeedback
6. TaskStatusHistory
7. TaskWorkLink
8. DTR
9. Department
10. InternProfile
11. Notification
12. ActivityLog
13. Whitelist

See [Data Models](../architecture/data-models) for detailed schemas.

## Routes

Routes map HTTP methods and paths to controller functions.

```typescript
// Example: taskRoutes.ts
router.get("/", authMiddleware, taskController.listTasks);
router.post("/", authMiddleware, rbac.requireGlobalRole("Admin"), taskController.createTask);
router.patch("/:id", authMiddleware, rbac.ownsResource("task"), taskController.updateTask);
```

## Middlewares

### Authentication (authMiddleware.ts)
- Extracts JWT from Authorization header
- Verifies token signature
- Attaches user to `req.user`
- Returns 401 if invalid

### RBAC (rbac.ts)
- `requireGlobalRole(...roles)` - Check global role
- `requireDepartmentRole(...roles)` - Check department role
- `isSameUser()` - Verify ownership
- `hasSharedDepartment()` - Check department access

### Activity Logger (activityLogger.ts)
- Logs every action to ActivityLog model
- Captures user, action, entity, old/new values

### Security Middleware (index.ts)
- Helmet - Security headers
- CORS - Cross-origin requests
- Rate limiting - Prevent abuse

## Socket.io Integration

Real-time communication for notifications, updates, and collaborative features.

```typescript
// Socket server initialization
io.on("connection", (socket) => {
  // Authenticate socket using JWT
  // Handle real-time events:
  // - task-updated
  // - notification-received
  // - dtr-approved
  // - comment-added
});
```

**Key Features**:
- JWT authentication for socket connections
- User-specific event broadcasting
- Department-scoped updates
- Automatic cleanup on disconnect

## API Routes Summary

```
/api/auth
  POST /login          - Authenticate user
  POST /logout         - Logout user

/api/users
  GET /                - List all users
  GET /:id             - Get user details
  POST /               - Create user (Admin only)
  PATCH /:id           - Update user

/api/tasks
  GET /                - List tasks (filtered by role/dept)
  POST /               - Create task
  PATCH /:id           - Update task
  DELETE /:id          - Delete task

/api/departments
  GET /                - List departments
  POST /               - Create department (Admin+)
  PATCH /:id           - Update department

/api/intern-profiles
  GET /                - List profiles
  POST /               - Create profile
  PATCH /:id           - Update profile

/api/notifications
  GET /                - Get user notifications
  PATCH /:id/read      - Mark as read

/api/activity-logs
  GET /                - Get activity logs (Admin+)
```

## Error Handling

Consistent error responses:

```typescript
{
  status: number,
  message: string,
  timestamp: string,
  path: string,
  errors?: object[]
}
```

## Security Features

1. **CORS** - Restricted origins
2. **Helmet** - HTTP security headers
3. **Rate Limiting** - Prevent brute force
4. **JWT** - Stateless authentication
5. **Password Hashing** - bcryptjs
6. **RBAC** - Fine-grained permissions
7. **Input Validation** - Zod schemas
8. **Activity Logging** - Full audit trail

---

**Recommendation**: Read about specific components:  
[Controllers](./controllers) | [Services](./services) | [Models](./models) | [Middlewares & RBAC](./middlewares) | [Real-time with Socket.io](./socket)