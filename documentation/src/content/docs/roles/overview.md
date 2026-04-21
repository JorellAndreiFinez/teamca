---
title: Role-Based Access Control
description: System roles and permissions overview
---

## Overview

TeamCA implements a two-level RBAC system:

1. **Global Roles** - System-wide permission level
2. **Department Roles** - Department-specific permissions

Users can have different global and department roles simultaneously.

## Global Roles

### Superadmin

**Highest privilege level** - Full system access.

**Capabilities**:
- Create, read, update, delete all users
- Manage all departments
- Assign/change global and department roles
- View all activity logs
- Access admin dashboard
- Configure system settings
- View all tasks and assignments across system
- Approve/reject any DTR records
- Manage intern profiles system-wide

**Backend Access**:
```typescript
// Any endpoint can check:
rbac.requireGlobalRole("Superadmin")

// Or composite check:
if (req.user.global_role === "Superadmin") {
  // Allow unrestricted access
}
```

**Frontend Access**:
```typescript
if (user?.global_role === "Superadmin") {
  // Show admin dashboard
  // Show all users
  // Show system settings
}
```

**Restrictions**: None - has all permissions

---

### Admin

**Elevated privilege level** - Department and user management.

**Capabilities**:
- Create, read, update users in assigned departments
- Manage departments they're assigned to
- View activity logs for their departments
- Access admin dashboard
- Assign tasks within department
- Approve DTR records in department
- View department reports
- Manage intern profiles in department

**Backend Access**:
```typescript
// Admin-only endpoints
rbac.requireGlobalRole("Admin", "Superadmin")

// Department-scoped operations
if (req.user.global_role === "Admin") {
  const tasks = await Task.find({
    department_id: req.user.department_id
  });
}
```

**Frontend Access**:
```typescript
if (["Admin", "Superadmin"].includes(user?.global_role)) {
  // Show admin features
  // Show department users
  // Show department tasks
}
```

**Restrictions**: 
- Cannot manage other departments
- Cannot modify global roles
- Cannot access system settings

---

### Standard_User

**Default role** - Base user with personal access.

**Capabilities**:
- View own profile
- View assigned tasks
- Record own DTR
- View own activity
- Receive notifications
- Comment on tasks
- View own department info
- Update own profile

**Backend Access**:
```typescript
// Standard users: Personal access only
const userId = req.user.user_id;
const userTasks = await Task.find({ 
  created_by: userId 
});

// Department members can see dept info
const dept = await Department.findById(req.user.department_id);
```

**Frontend Access**:
```typescript
// Standard user dashboard
if (user?.global_role === "Standard_User") {
  // Show personal tasks
  // Show personal DTR
  // Show personal profile
  // Hide admin features
}
```

**Restrictions**:
- Cannot create users
- Cannot create departments
- Cannot manage other users
- Cannot approve DTRs
- Cannot access activity logs
- Cannot assign tasks (unless department role is supervisor+)

---

## Department Roles

Users have department-specific roles within each department they belong to. These are independent of global roles.

### Head

**Department authority** - Full control over department operations.

**Applies to**: User with `departments[].department_role === "Head"`

**Capabilities**:
- Approve/reject all DTR records in department
- Assign tasks to department members
- View all department member records
- Access department reports
- Reassign tasks
- Manage department members
- View department activity logs

**Backend Access**:
```typescript
// Check department role
if (hasDepartmentRoleIn(req.user, ["Head"])) {
  // Allow department-wide operations
  const members = await User.find({
    "departments.department_id": req.user.department_id
  });
}
```

**Frontend Access**:
```typescript
if (user?.departments.some(d => d.department_role === "Head")) {
  // Show department head features
  // Show all member tasks
  // Show approval queue
}
```

---

### Supervisor

**Team lead role** - Manage assigned interns.

**Applies to**: User with `departments[].department_role === "Supervisor"`

**Capabilities**:
- Approve DTR records for assigned interns
- Assign tasks to assigned interns
- View assigned intern task progress
- Monitor assigned intern activity
- Provide feedback on tasks

**Backend Access**:
```typescript
// Supervisor can approve DTR for their interns
if (hasDepartmentRoleIn(req.user, ["Supervisor", "Head"])) {
  await dtrService.approveDTR(dtrId, req.user.user_id);
}
```

**Frontend Access**:
```typescript
if (user?.departments.some(d => d.department_role === "Supervisor")) {
  // Show DTR approval queue for assigned interns
  // Show assigned tasks
}
```

---

### Intern

**Junior role** - Limited to assigned work.

**Applies to**: User with `departments[].department_role === "Intern"`

**Capabilities**:
- Record own DTR
- View assigned tasks
- Submit task comments
- View own profile
- Receive notifications
- View school/contact information (own profile only)

**Backend Access**:
```typescript
// Interns: Self-service only
if (hasDepartmentRoleIn(req.user, ["Intern"])) {
  // Can only access own DTR
  // Can only see assigned tasks
}
```

**Frontend Access**:
```typescript
if (user?.departments.some(d => d.department_role === "Intern")) {
  // Show intern dashboard
  // Show assigned tasks
  // Show DTR form
  // Hide admin features
}
```

---

## Permission Matrix

| Action | Superadmin | Admin | Standard_User (Head) | Standard_User (Supervisor) | Standard_User (Intern) |
|--------|-----------|-------|----------------------|--------------------------|----------------------|
| Create User | ✅ | ✅ (own dept) | ❌ | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ (dept) | ❌ | ❌ | ❌ |
| Update User Role | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Activity | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ✅ | ❌ |
| Assign Task | ✅ | ✅ | ✅ | ✅ (to interns) | ❌ |
| Record DTR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve DTR | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| View Dept Reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Dept Members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change Global Role | ✅ | ❌ | ❌ | ❌ | ❌ |

## Frontend Role-Based Routes

### Login Page (Public)

```
/login - Accessible to everyone
/setup - Setup wizard (first-time config)
```

### Standard User Routes

```
/dashboard - Personal dashboard
/profile - User profile (own only)
/tasks - Assigned tasks
/dtr - Time tracking
/notifications - Personal notifications
/activity-logs - Personal activity only
```

### Department Head Routes (Extends Standard_User)

```
/dashboard - Department dashboard
/department/members - List department members
/department/tasks - All department tasks
/department/dtr - Approve DTR for department
/department/reports - Department reports
/activity-logs - Department activity (with filters)
```

### Admin Routes (Extends Head)

```
/admin/users - User management
/admin/departments - Department management
/admin/system-logs - All activity logs
/admin/settings - System configuration
```

### Superadmin Routes (All Access)

```
/superadmin - Superadmin dashboard
/superadmin/users - All users, full control
/superadmin/departments - All departments
/superadmin/activity-logs - Complete audit trail
/superadmin/settings - System settings
/superadmin/roles - Manage all roles
```

### Example Route Protection

```typescript
// pages/admin/users.astro
---
import { useAuthStore } from "../../store/authStore";

const user = useAuthStore.getState().user;

// Redirect non-admin users
if (!user || !["Admin", "Superadmin"].includes(user.global_role)) {
  return new Response(null, { status: 403, statusText: "Forbidden" });
}
---

<DashboardLayout>
  <UserManagement />
</DashboardLayout>
```

## Backend Route Protection Examples

### Admin-Only Endpoint

```typescript
// Create user (Admin+ only)
router.post("/users",
  authMiddleware,
  rbac.requireGlobalRole("Admin", "Superadmin"),
  userController.createUser
);
```

### Department-Scoped Endpoint

```typescript
// Approve DTR (Head/Supervisor of department only)
router.post("/dtr/:id/approve",
  authMiddleware,
  rbac.requireDepartmentRole("Head", "Supervisor"),
  dtrController.approveDTR
);
```

### Multi-Level Check

```typescript
// View department tasks
router.get("/tasks",
  authMiddleware,
  (req, res, next) => {
    const canView = 
      req.user.global_role === "Superadmin" ||
      (req.user.global_role === "Admin" && 
       hasSharedDepartment(req.user, req.query.departmentId)) ||
      (hasDepartmentRoleIn(req.user, ["Head", "Supervisor"]) &&
       hasSharedDepartment(req.user, req.query.departmentId));
    
    if (!canView) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    next();
  },
  taskController.listTasks
);
```

## Assigning Roles

### Superadmin Assigning Roles

```typescript
// POST /api/users/:id/role (Superadmin only)
{
  global_role: "Admin",  // or "Standard_User"
  departments: [
    {
      department_id: "507f1f77bcf86cd799439012",
      department_role: "Head"
    },
    {
      department_id: "507f1f77bcf86cd799439013",
      department_role: "Supervisor"
    }
  ]
}
```

### Role Assignment Validation

```typescript
// Backend must validate
// 1. Only Superadmin can change global roles
// 2. Admin can change department roles in their dept
// 3. Cannot elevate own permissions
// 4. Cannot give permissions they don't have themselves
```

## Best Practices

1. **Always check roles on backend** - Never trust frontend role checks alone
2. **Use consistent role checks** - Define reusable middleware for common patterns
3. **Log role-based actions** - Track permission checks in activity logs
4. **Document permission changes** - When roles are assigned/changed
5. **Principle of least privilege** - Give users minimum required permissions
6. **Regular audits** - Review role assignments periodically
7. **Handle permission errors gracefully** - Show helpful messages to users

---

**Recommendation**: View specific [Modules Overview](../modules/overview)
