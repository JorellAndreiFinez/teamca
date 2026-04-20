---
title: Admin Role
description: Admin permissions and responsibilities
---

## Summary

**Admin** is an elevated role with department and user management capabilities.

## Permissions Overview

| Category | Permissions |
|----------|-----------|
| Users | Create, read, update users in assigned departments |
| Roles | Assign/change department roles in assigned departments |
| Departments | Manage assigned departments |
| Tasks | Create, view, assign tasks in departments |
| DTR | Approve/reject DTR in departments |
| Reports | View department-level reports |
| Activity Logs | View activity logs for assigned departments |

## Use Cases

### Department User Management

**Create user in department**:
```
Admin Dashboard → Users → Create User
```

Can only create users in departments they're assigned to.

**Update user information**:
```
Admin Dashboard → Users → Select User → Edit
```

Can modify department-scoped user data.

**Assign department role**:
```
Admin Dashboard → Users → Select User → Department Role
```

Can assign Head, Supervisor, or Intern roles in their department.

### Task Management

**Assign tasks within department**:
```
Admin Dashboard → Tasks → Create Task → Assign
```

Can create and assign tasks to department members.

**View department tasks**:
```
Admin Dashboard → Tasks (filtered to department)
```

Sees only tasks in assigned department(s).

### DTR Management

**Approve department DTR**:
```
Admin Dashboard → DTR → Approval Queue
```

Can approve time records for all interns in department.

**View department reports**:
```
Admin Dashboard → Reports → Department DTR
```

Sees attendance, hours, and performance metrics.

## API Access

### Department-Scoped Endpoints

Admin can access endpoints filtered by department:

```
GET    /api/users?department={deptId}
GET    /api/users/:id           (if in same department)
POST   /api/users               (requires department_id)
PATCH  /api/users/:id           (if in same department)

GET    /api/tasks?department={deptId}
POST   /api/tasks               (must specify department)

GET    /api/dtr?department={deptId}
POST   /api/dtr/:id/approve     (if in department)

GET    /api/activity-logs?department={deptId}
```

### Example Request

```bash
# List users in my departments
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/users?department=507f1f77bcf86cd799439012

# Response includes only users in that department
```

### Restrictions

Admin **cannot**:
- Delete users
- Change global roles
- Access other departments
- View system-wide settings
- Approve DTR outside their department
- View activity logs from other departments

## Frontend Experience

### Available Menu Items

```
Sidebar for Admin:
├─ Dashboard
├─ Users
│  ├─ Department Users
│  ├─ Add User
│  └─ Manage Roles
├─ Departments
│  ├─ My Departments
│  └─ Members
├─ Tasks
│  ├─ Department Tasks
│  ├─ Create Task
│  └─ Assignments
├─ DTR
│  ├─ Department Records
│  ├─ Approval Queue
│  └─ Reports
├─ Department Reports
│  ├─ Attendance
│  ├─ Hours Summary
│  └─ Task Performance
└─ My Profile
```

## Department Assignment

Admins are assigned to specific departments:

```typescript
{
  global_role: "Admin",
  departments: [
    {
      department_id: "507f1f77bcf86cd799439012",
      department_role: "Head"  // Usually Head of assigned dept
    }
  ]
}
```

An admin can be assigned to multiple departments:

```typescript
{
  global_role: "Admin",
  departments: [
    {
      department_id: "507f1f77bcf86cd799439012",
      department_role: "Head"  // Engineering Head
    },
    {
      department_id: "507f1f77bcf86cd799439013",
      department_role: "Supervisor"  // HR Supervisor
    }
  ]
}
```

## Typical Workflow

### Onboarding Intern to Department

1. **Admin creates intern user**
   ```
   POST /api/users
   { 
     first_name: "John",
     last_name: "Doe",
     email: "john@example.com",
     global_role: "Standard_User",
     departments: [{
       department_id: "507f1f77bcf86cd799439012",
       department_role: "Intern"
     }]
   }
   ```

2. **Admin creates intern profile**
   ```
   POST /api/intern-profiles
   {
     user_id: "...",
     school: "State University",
     course: "Computer Science",
     start_date: "2024-04-20"
   }
   ```

3. **Admin assigns first task**
   ```
   POST /api/tasks
   {
     title: "Onboarding Training",
     description: "Complete company orientation"
   }
   
   POST /api/tasks/:id/assign
   { assigned_to: userId }
   ```

4. **Monitor intern progress**
   ```
   GET /api/tasks?assigned_to={userId}
   GET /api/dtr?user={userId}
   GET /api/activity-logs?user={userId}
   ```

### Approving DTR Records

1. **Check approval queue**
   ```
   Admin Dashboard → DTR → Approval Queue
   ```

2. **Review record**
   - Check time_in and time_out
   - Verify hours_worked calculation
   - Check remarks if present

3. **Approve or reject**
   ```
   POST /api/dtr/:id/approve
   { remarks: "Approved" }
   
   // Or reject with reason
   POST /api/dtr/:id/reject
   { remarks: "Time entry incomplete" }
   ```

4. **Intern receives notification**
   - Socket notification: "DTR approved"
   - In-app notification card
   - Email notification (if enabled)

## Access Control Examples

### Department Scope Validation

```typescript
// Backend ensures admin can only modify department users
async updateUser(req: Request, res: Response) {
  const userId = req.params.id;
  const adminUser = req.user;
  
  // Get the user being updated
  const targetUser = await User.findById(userId);
  
  // Check if in same department
  const inDept = targetUser.departments.some(d =>
    String(d.department_id) === String(adminUser.department_id)
  );
  
  if (!inDept) {
    return res.status(403).json({ 
      message: "Can only manage users in your department" 
    });
  }
  
  // Proceed with update
}
```

### Department-Filtered Listing

```typescript
// Admin lists only department tasks
async listTasks(req: Request, res: Response) {
  const adminUser = req.user;
  
  const tasks = await Task.find({
    // OR across all departments admin is in
    $or: adminUser.departments.map(d => ({
      department_id: d.department_id
    }))
  });
  
  res.json(tasks);
}
```

## Limitations

### What Admins Cannot Do

```
❌ Delete users
❌ Change user global roles
❌ Access other departments
❌ View system-wide settings
❌ Approve DTR outside their department
❌ Delete departments
❌ Change their own role
```

### Why These Limitations?

- **Delete users**: Sensitive operation, only superadmin
- **Change global roles**: Only superadmin can elevate permissions
- **Access other departments**: Data isolation and privacy
- **System settings**: Company-wide configuration
- **Change own role**: Prevent privilege escalation

## Security Best Practices

1. **Regular audits** - Review admin actions monthly
2. **Activity monitoring** - Watch for unusual patterns
3. **Limit admins** - Only necessary staff should be admins
4. **Strong passwords** - Enforce strong auth credentials
5. **MFA recommended** - Multi-factor authentication for accounts
6. **Separation of duties** - Different admins for different depts

---

**Recommendation**: Read about [Standard User Role](./user)
