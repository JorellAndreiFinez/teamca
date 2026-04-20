---
title: Middlewares
description: Request processing and authentication middleware
---

Middlewares are functions that process requests before they reach controllers. TeamCA uses several layers of middleware for authentication, authorization, and logging.

## Authentication Middleware

Verifies user identity via JWT tokens.

**Location**: `src/middlewares/auth.ts` and `src/middlewares/authMiddleware.ts`

### JWT Extraction

```typescript
// Extracts JWT from Authorization header
// Format: "Bearer <token>"

// On valid token:
req.user = {
  user_id: string,
  email: string,
  global_role: GlobalRole,
  department_id?: ObjectId,
  department_role?: DepartmentRole,
  iat: number,
  exp: number
}

// On invalid/missing token:
res.status(401).json({ message: "Authentication required" })
```

### Usage in Routes

```typescript
// Protected route
router.post("/tasks", authMiddleware, taskController.createTask);

// Protected with role check
router.post("/users", 
  authMiddleware, 
  rbac.requireGlobalRole("Admin", "Superadmin"),
  userController.createUser
);
```

## RBAC (Role-Based Access Control)

Fine-grained permission system with global and department-scoped roles.

**Location**: `src/middlewares/rbac.ts`

### Role Hierarchy Summary

```
Global Roles:
  Superadmin
    ├─ Can manage all users
    ├─ Can manage all departments
    ├─ Can view all activity logs
    └─ Unrestricted access

  Admin
    ├─ Can manage users in assigned departments
    ├─ Can manage departments
    ├─ Can view department activity logs
    └─ Limited department access

  Standard_User
    ├─ Can only access own resources
    ├─ Can create tasks
    └─ Limited to assigned department

Department Roles (per department):
  Head
    ├─ Can approve DTR for department
    ├─ Can manage department members
    ├─ Can assign tasks
    └─ Department-level authority

  Supervisor
    ├─ Can approve DTR for assigned interns
    ├─ Can assign tasks
    ├─ Can view department reports
    └─ Team management level

  Intern
    ├─ Can record own DTR
    ├─ Can view assigned tasks
    ├─ Can submit comments
    └─ Limited to assigned work
```

### RBAC Middleware Functions

#### `requireGlobalRole(...allowedRoles: GlobalRole[])`

Middleware to check if user has required global role.

```typescript
// Usage
router.post("/users",
  authMiddleware,
  rbac.requireGlobalRole("Admin", "Superadmin"),
  userController.createUser
);

// Implementation
export const requireGlobalRole = (...allowedRoles: GlobalRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.user.global_role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
};

// Returns 403 Forbidden if role not in allowedRoles
```

#### `requireDepartmentRole(...allowedRoles: DepartmentRole[])`

Checks if user has required role in their department.

```typescript
// Usage
router.post("/dtr/:id/approve",
  authMiddleware,
  rbac.requireDepartmentRole("Head", "Supervisor"),
  dtrController.approveDTR
);

// Returns 403 if user doesn't have role in their department
```

#### `hasDepartmentRoleIn(user, allowedRoles) → boolean`

Utility function to check department role membership.

```typescript
// In service logic
if (!hasDepartmentRoleIn(req.user, ["Head", "Supervisor"])) {
  throw new Error("Only heads and supervisors can approve");
}
```

#### `isSameUser(requestUser, targetUserId) → boolean`

Checks if requester is the target user.

```typescript
// Prevents users from accessing others' data
if (!isSameUser(req.user, userId) && req.user.global_role === "Standard_User") {
  return res.status(403).json({ message: "Cannot access other users' data" });
}
```

#### `hasSharedDepartment(requestUser, targetDepartmentId) → boolean`

Checks if users are in same department.

```typescript
// Supervisors can see tasks in their department
if (!hasSharedDepartment(req.user, departmentId)) {
  return res.status(403).json({ message: "Cannot access other departments" });
}
```

### Authorization Patterns

#### Pattern 1: Global Role Check

```typescript
// Admin-only endpoint
router.delete("/users/:id",
  authMiddleware,
  rbac.requireGlobalRole("Superadmin"),
  userController.deleteUser
);
```

#### Pattern 2: Resource Ownership

```typescript
// User can only update own profile
router.patch("/users/:id",
  authMiddleware,
  (req, res, next) => {
    if (!isSameUser(req.user, req.params.id)) {
      return res.status(403).json({ message: "Cannot modify other users" });
    }
    next();
  },
  userController.updateUser
);
```

#### Pattern 3: Department Scope

```typescript
// Supervisors can approve DTR in their department
router.post("/dtr/:id/approve",
  authMiddleware,
  (req, res, next) => {
    if (!hasDepartmentRoleIn(req.user, ["Head", "Supervisor"])) {
      return res.status(403).json({ message: "Insufficient role" });
    }
    next();
  },
  dtrController.approveDTR
);
```

#### Pattern 4: Composite Check

```typescript
// Complex permission check in controller
async updateTask(req: Request, res: Response) {
  const task = await Task.findById(req.params.id);
  
  const canUpdate = 
    task.created_by === req.user.user_id ||  // Task creator
    req.user.global_role === "Superadmin" ||  // Superadmin
    (req.user.global_role === "Admin" &&      // Admin in dept
     hasSharedDepartment(req.user, task.department_id));
  
  if (!canUpdate) {
    return res.status(403).json({ message: "Cannot update task" });
  }
  
  // Proceed with update
}
```

## Activity Logger Middleware

Logs all significant actions for audit trail.

**Location**: `src/middlewares/activityLogger.ts`

```typescript
// Automatically logs:
// - POST requests (creates)
// - PATCH requests (updates)
// - DELETE requests (deletions)

// Captured data:
{
  user_id: req.user.user_id,
  action: "create_task",
  entity_type: "Task",
  entity_id: createdEntity._id,
  old_values: null,
  new_values: { title, description, ... },
  ip_address: req.ip,
  user_agent: req.get("user-agent"),
  timestamp: Date.now()
}

// Used for:
// - Compliance and audit trails
// - Debugging and troubleshooting
// - User action history
// - Suspicious activity detection
```

### Integration

```typescript
// Applied globally or per-route
app.post("*", activityLogger);  // Log all POST requests
app.patch("*", activityLogger);  // Log all PATCH requests
app.delete("*", activityLogger);  // Log all DELETE requests
```

## Security Middleware Stack

Order of middleware matters in Express:

```typescript
// 1. Parse request body
app.use(express.json());

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(cors(corsOptions));

// 4. Rate limiting (prevent DoS)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
}));

// 5. Authentication (verify JWT)
app.use("/api", authMiddleware);

// 6. Activity logging
app.use("/api", activityLogger);

// 7. Routes
app.use("/api", routes);
```

## Middleware Response Examples

### Successful Authentication

```
Status: 200
Request continues to controller
req.user populated
```

### Missing Auth Header

```json
{
  "status": 401,
  "message": "Authentication required"
}
```

### Invalid Token

```json
{
  "status": 401,
  "message": "Invalid or expired token"
}
```

### Insufficient Role

```json
{
  "status": 403,
  "message": "Insufficient permissions"
}
```

## Custom Authorization Middleware

Creating app-specific authorization middleware:

```typescript
// Only task owners can modify
export const ownsTask = (req: Request, res: Response, next: NextFunction) => {
  Task.findById(req.params.taskId).then(task => {
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    if (task.created_by.toString() !== req.user.user_id) {
      return res.status(403).json({ message: "Not task owner" });
    }
    
    next();
  }).catch(err => res.status(500).json({ message: err.message }));
};

// Usage
router.patch("/:taskId", authMiddleware, ownsTask, updateTask);

// Only department members
export const inDepartment = (departmentField = "department_id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetDeptId = req.body[departmentField];
    
    if (!hasSharedDepartment(req.user, targetDeptId)) {
      return res.status(403).json({ message: "Not in department" });
    }
    
    next();
  };
};

// Usage
router.post("/", authMiddleware, inDepartment(), createDepartmentTask);
```

## Testing Middleware

```typescript
// Mock JWT for testing
const mockUser = {
  user_id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  global_role: "Admin",
  department_id: "507f1f77bcf86cd799439012",
  department_role: "Head"
};

const token = jwt.sign(mockUser, process.env.JWT_SECRET, { 
  expiresIn: "1h" 
});

// Test protected endpoint
fetch("http://localhost:3000/api/tasks", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
});
```

---

**Recommendation**: Learn about [Real-time with Socket.io](./socket)
