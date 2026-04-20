---
title: Controllers
description: HTTP request handlers and routing
---

Controllers are request handlers that extract HTTP request data and delegate business logic to services.

## Auth Controller

Manages user authentication flows.

**Location**: `src/controllers/authController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/login` | POST | Authenticate user, return JWT |
| `/auth/logout` | POST | Invalidate session |
| `/auth/refresh` | POST | Get new JWT using refresh token |

**Request/Response Examples**:

```typescript
// POST /auth/login
Request: {
  email: "user@example.com",
  password: "password123"
}

Response (200): {
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    user_id: "507f1f77bcf86cd799439011",
    email: "user@example.com",
    global_role: "Standard_User",
    departments: [...]
  },
  expires_in: 3600
}

Response (401): {
  status: 401,
  message: "Invalid credentials"
}
```

**Typical Flow**:
```
1. authController.login() receives request
2. Validates email/password format
3. Calls authService.authenticate(email, password)
4. Service finds user, compares passwords
5. Generates JWT token
6. Returns token + user info
```

---

## User Controller

Manages user CRUD operations and user management.

**Location**: `src/controllers/userController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/users` | GET | List all users (paginated) |
| `/users/:id` | GET | Get user details |
| `/users` | POST | Create new user (Admin+) |
| `/users/:id` | PATCH | Update user info |
| `/users/:id/role` | PATCH | Update user role (Superadmin only) |

**Request/Response Examples**:

```typescript
// GET /users?page=1&limit=20
Response (200): {
  users: [
    {
      _id: "507f1f77bcf86cd799439011",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      global_role: "Standard_User",
      departments: [
        {
          department_id: "507f1f77bcf86cd799439012",
          department_role: "Intern"
        }
      ],
      is_active: true,
      created_at: "2024-01-15T10:30:00Z"
    }
  ],
  total: 150,
  page: 1,
  limit: 20
}

// POST /users
Request: {
  first_name: "Jane",
  last_name: "Smith",
  email: "jane@example.com",
  password: "securepass123",
  global_role: "Standard_User",
  departments: [
    {
      department_id: "507f1f77bcf86cd799439012",
      department_role: "Intern"
    }
  ]
}

Response (201): { ...user_object }

// PATCH /users/:id
Request: {
  first_name: "Jane",
  working_hours: { start: "08:00", end: "17:00" }
}

Response (200): { ...updated_user }
```

---

## Task Controller

Handles task creation, updates, and retrieval.

**Location**: `src/controllers/taskController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/tasks` | GET | List tasks (filtered by permissions) |
| `/tasks/:id` | GET | Get task details |
| `/tasks` | POST | Create new task |
| `/tasks/:id` | PATCH | Update task |
| `/tasks/:id/status` | PATCH | Change task status |
| `/tasks/:id/comments` | POST | Add comment to task |
| `/tasks/:id/feedback` | POST | Add feedback to task |

**Request/Response Examples**:

```typescript
// POST /tasks
Request: {
  title: "Implement user profile",
  description: "Create profile editing interface",
  priority: "High",
  deadline: "2024-04-30T17:00:00Z"
}

Response (201): {
  _id: "507f1f77bcf86cd799439013",
  title: "Implement user profile",
  description: "Create profile editing interface",
  created_by: "507f1f77bcf86cd799439011",
  status: "Not Started",
  priority: "High",
  deadline: "2024-04-30T17:00:00Z",
  created_at: "2024-04-20T10:30:00Z"
}

// PATCH /tasks/:id/status
Request: {
  status: "In Progress"
}

Response (200): { ...updated_task }

// Socket event emitted:
{
  event: "task-updated",
  data: { taskId, newStatus, updatedAt }
}
```

**Access Control**:
- **Create**: Any authenticated user
- **Update**: Task creator or Admin
- **View**: Own tasks or tasks in same department

---

## Department Controller

Manages department configuration and organization.

**Location**: `src/controllers/departmentController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/departments` | GET | List all departments |
| `/departments/:id` | GET | Get department details |
| `/departments` | POST | Create department (Admin+) |
| `/departments/:id` | PATCH | Update department |
| `/departments/:id/members` | GET | Get department members |

**Request/Response Examples**:

```typescript
// POST /departments
Request: {
  name: "Engineering",
  description: "Software engineering department",
  head_id: "507f1f77bcf86cd799439011"
}

Response (201): {
  _id: "507f1f77bcf86cd799439012",
  name: "Engineering",
  description: "Software engineering department",
  head_id: "507f1f77bcf86cd799439011",
  is_active: true,
  created_at: "2024-04-20T10:30:00Z"
}

// GET /departments/:id/members
Response (200): {
  department: { ...department },
  members: [
    {
      user_id: "507f1f77bcf86cd799439011",
      name: "John Doe",
      role: "Head"
    },
    {
      user_id: "507f1f77bcf86cd799439013",
      name: "Jane Smith",
      role: "Supervisor"
    }
  ]
}
```

---

## Intern Profile Controller

Manages extended profiles for interns.

**Location**: `src/controllers/internProfileController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/intern-profiles` | GET | List profiles |
| `/intern-profiles/:id` | GET | Get profile details |
| `/intern-profiles` | POST | Create profile |
| `/intern-profiles/:id` | PATCH | Update profile |
| `/intern-profiles/:id/status` | PATCH | Change status |

**Request/Response Examples**:

```typescript
// POST /intern-profiles
Request: {
  user_id: "507f1f77bcf86cd799439011",
  school: "State University",
  course: "Computer Science",
  level: "4th Year",
  contact_person: "Mom",
  contact_phone: "+1234567890",
  school_email: "student@university.edu",
  start_date: "2024-01-01"
}

Response (201): {
  _id: "507f1f77bcf86cd799439015",
  user_id: "507f1f77bcf86cd799439011",
  school: "State University",
  course: "Computer Science",
  status: "Active",
  ...
}
```

---

## Notification Controller

Manages user notifications.

**Location**: `src/controllers/notificationController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/notifications` | GET | Get user notifications |
| `/notifications/:id/read` | PATCH | Mark as read |
| `/notifications/read-all` | PATCH | Mark all as read |
| `/notifications/:id` | DELETE | Delete notification |

**Request/Response Examples**:

```typescript
// GET /notifications?limit=20&unread=true
Response (200): {
  notifications: [
    {
      _id: "507f1f77bcf86cd799439016",
      recipient_id: "507f1f77bcf86cd799439011",
      type: "task_assigned",
      title: "New Task Assigned",
      message: "You have been assigned 'Implement user profile'",
      related_entity_id: "507f1f77bcf86cd799439013",
      is_read: false,
      created_at: "2024-04-20T10:30:00Z"
    }
  ],
  unread_count: 5,
  total: 42
}

// PATCH /notifications/:id/read
Response (200): {
  ...notification,
  is_read: true
}
```

---

## Activity Controller

Retrieves activity logs for audit and monitoring.

**Location**: `src/controllers/activityController.ts`

**Key Endpoints**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/activity-logs` | GET | List activity logs (Admin+) |
| `/activity-logs/:id` | GET | Get activity details |
| `/activity-logs/user/:userId` | GET | Get user activity (Admin+) |

**Request/Response Examples**:

```typescript
// GET /activity-logs?action=create_task&limit=50
Response (200): {
  logs: [
    {
      _id: "507f1f77bcf86cd799439017",
      user_id: "507f1f77bcf86cd799439011",
      action: "create_task",
      entity_type: "Task",
      entity_id: "507f1f77bcf86cd799439013",
      old_values: null,
      new_values: {
        title: "Implement user profile",
        priority: "High"
      },
      ip_address: "192.168.1.1",
      created_at: "2024-04-20T10:30:00Z"
    }
  ],
  total: 234
}
```

---

## Controller Patterns

### Standard CRUD Pattern

```typescript
// Create
async create(req: Request, res: Response) {
  try {
    const data = req.body;
    const userId = req.user.user_id;
    
    const result = await service.create(data, userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Read List
async list(req: Request, res: Response) {
  const { page = 1, limit = 20, filter } = req.query;
  const results = await service.list(filter, page, limit);
  res.json(results);
}

// Read One
async getById(req: Request, res: Response) {
  const { id } = req.params;
  const result = await service.getById(id);
  res.json(result);
}

// Update
async update(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const result = await service.update(id, updates);
  res.json(result);
}

// Delete
async delete(req: Request, res: Response) {
  const { id } = req.params;
  await service.delete(id);
  res.status(204).send();
}
```

---

**Recommendation**: Learn about [Services](./services.md)
