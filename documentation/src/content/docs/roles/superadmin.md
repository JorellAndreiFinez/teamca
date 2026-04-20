---
title: Superadmin Role
description: Superadmin permissions and responsibilities
---

## Summary

**Superadmin** is the highest privilege level with unrestricted access to the entire system.

## Permissions Overview

| Category | Permissions |
|----------|-----------|
| Users | Create, read, update, delete all users |
| Roles | Assign/change all global and department roles |
| Departments | Create, read, update, delete all departments |
| Tasks | View, create, manage all tasks |
| DTR | Approve/reject any DTR record |
| Activity Logs | View complete system audit trail |
| System Settings | Configure all system settings |
| Notifications | Manage all notifications |

## Use Cases

### User Management

**Create new user**:
```
Superadmin Dashboard → Users → Create User
```

Can assign any global role and department role combinations.

**Delete user**:
```
Superadmin Dashboard → Users → User Actions → Delete
```

Only superadmin can delete users.

**Change user roles**:
```
Superadmin Dashboard → Users → Edit User → Roles
```

Can change from Superadmin → Admin → Standard_User and vice versa.

### System Administration

**View all activity**:
```
Superadmin Dashboard → Activity Logs (no filtering required)
```

Sees all actions by all users across all departments.

**Manage departments**:
```
Superadmin Dashboard → Departments
```

Full CRUD operations on all departments.

**Configure system**:
```
Superadmin Dashboard → Settings
```

Adjust system-wide configurations.

## API Access

### Full API Access

Superadmin can call any API endpoint without restrictions:

```
GET    /api/users              (all users)
GET    /api/users/:id          (any user)
POST   /api/users              (create any user)
PATCH  /api/users/:id          (edit any user)
DELETE /api/users/:id          (delete any user)

GET    /api/activity-logs      (all activity)
GET    /api/departments        (all departments)
POST   /api/departments        (create departments)

GET    /api/tasks              (all tasks)
GET    /api/dtr                (all DTR)
POST   /api/dtr/:id/approve    (approve any DTR)
```

### Example Request

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/users

# Response includes all users in system
```

## Frontend Experience

### Available Menu Items

```
Sidebar for Superadmin:
├─ Dashboard
├─ Departments
│  ├─ Department List
│  ├─ Members
│  └─ Reports
├─ Tasks
│  ├─ All Tasks
│  └─ Assignments
├─ DTR
│  ├─ All Records
│  ├─ Approval Queue
│  └─ Reports
| 
├─ Activity Logs (Complete)
├─ Users Management
│  ├─ All Users
│  ├─ Roles
│  └─ Permissions
├─ System Settings
│  ├─ Configuration
│  ├─ Roles & Permissions
│  └─ Integrations
└─ Audit Trail
```

## Restrictions

**None** - Superadmin has no restrictions.

⚠️ **Important**: Superadmin privileges should be granted only to trusted administrators (specifically FSD team). Consider:
- Requiring multi-factor authentication for superadmin accounts
- Limiting number of superadmin users
- Regular audits of superadmin actions
- Separate superadmin account for administrative tasks only

## Typical Workflow

### Onboarding New Intern Department

1. **Superadmin creates department**
   ```
   POST /api/departments
   { name: "Marketing", description: "Marketing team" }
   ```

2. **Superadmin creates department head user**
   ```
   POST /api/users
   { 
     email: "head@example.com",
     global_role: "Standard_User",
     departments: [{
       department_id: "...",
       department_role: "Head"
     }]
   }
   ```

3. **Superadmin creates intern users**
   ```
   POST /api/users
   { 
     email: "intern@example.com",
     global_role: "Standard_User",
     departments: [{
       department_id: "...",
       department_role: "Intern"
     }]
   }
   ```

4. **Monitor via activity logs**
   ```
   GET /api/activity-logs?action=create_user
   ```

## Security Considerations

### Best Practices for Superadmin

1. **Use strong password** - Enforce complexity requirements
2. **Enable MFA** - Two-factor authentication recommended
3. **Audit actions regularly** - Review superadmin activity logs
4. **Limit access** - Only grant when necessary
5. **Use separate account** - Don't use for regular tasks
6. **Document changes** - Log reason for major changes
7. **Regular backups** - System data should be backed up regularly

### Monitoring Superadmin Activity

```
All superadmin actions are logged:
- User created/modified/deleted
- Role assignments
- Department changes
- Configuration changes
- Large data exports

Activity logs should be:
- Monitored for suspicious activity
- Archived for compliance
- Reviewed periodically
```

---

**Recommendation**: Read about [Admin Role](./admin) or [Standard User Role](./user)
