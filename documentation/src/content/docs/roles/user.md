---
title: Standard User Role
description: Standard user permissions and capabilities
---

## Summary

**Standard_User** is the default role assigned to all new users. Users with this role can access personal and assigned resources based on their department role.

## Permission Hierarchy

Standard_User permissions depend on department role:

```
Standard_User
├─ Global permissions (shared by all)
│  ├─ View own profile
│  ├─ Receive notifications
│  └─ Record own DTR
│
└─ Department permissions (based on role)
   ├─ Head
   │  ├─ Approve DTR
   │  ├─ Assign tasks
   │  └─ View all dept members
   │
   ├─ Supervisor
   │  ├─ Approve DTR (for assigned)
   │  ├─ Assign tasks (to assigned)
   │  └─ View team performance
   │
   └─ Intern
      ├─ Record own DTR
      ├─ View assigned tasks
      └─ Limited to own work
```

## Department Roles

### Standard_User with "Head" Role

**Department authority** - Manages entire department.

**Capabilities**:
- Approve/reject all DTR records for department
- Assign tasks to any department member
- View all department member information
- Access department reports
- Manage team structure
- View all department activity logs

**Example Workflow**:
```
Department Head
  ├─ Reviews daily DTR submissions
  ├─ Approves time records
  ├─ Assigns tasks to supervisors/interns
  ├─ Monitors department performance
  └─ Reports to admin/superadmin
```

**Frontend Access**:
```
✅ Department Dashboard
✅ All Department Members
✅ DTR Approval Queue
✅ Task Assignments (full control)
✅ Department Reports
✅ Department Activity Logs
❌ System Settings
❌ Other Departments
❌ User Management
```

---

### Standard_User with "Supervisor" Role

**Team management** - Oversees assigned team members.

**Capabilities**:
- Approve DTR for assigned interns
- Assign tasks to assigned interns
- View assigned team member progress
- Monitor intern activity
- Provide performance feedback

**Example Workflow**:
```
Supervisor
  ├─ Approves DTR for 5 assigned interns
  ├─ Assigns daily tasks
  ├─ Provides feedback on completed work
  ├─ Monitors progress
  └─ Reports to department head
```

**Frontend Access**:
```
✅ Team Dashboard
✅ Assigned Team Members Only
✅ DTR Approval (for assigned)
✅ Task Assignment (to assigned)
✅ Team Performance Reports
✅ Team Activity
❌ Department Wide Reports
❌ All Department Members
❌ Other Departments
```

---

### Standard_User with "Intern" Role

**Junior team member** - Entry-level with limited responsibilities.

**Capabilities**:
- Record own DTR entries
- View assigned tasks
- Submit comments on tasks
- View own profile
- Receive notifications
- Submit feedback on completed work

**Example Workflow**:
```
Intern
  ├─ Records daily time entries
  ├─ Completes assigned tasks
  ├─ Communicates via task comments
  ├─ Receives feedback
  └─ Learns and develops skills
```

**Frontend Access**:
```
✅ Intern Dashboard
✅ Personal Profile
✅ Assigned Tasks Only
✅ DTR Recording
✅ Task Comments
✅ Personal Notifications
❌ Other Intern Tasks
❌ Department Tasks
❌ Admin Features
❌ Reports
```

## API Access Examples

### Head Endpoints

```bash
# List all department tasks
GET /api/tasks?department={deptId}

# Get all department members
GET /api/users?department={deptId}

# Approve DTR record
POST /api/dtr/:id/approve
{ remarks: "Approved" }

# View department activity
GET /api/activity-logs?department={deptId}

# Get department statistics
GET /api/reports/department/{deptId}/summary
```

### Supervisor Endpoints

```bash
# List assigned interns' tasks
GET /api/tasks?assigned_to={internIds}

# Get DTR for assigned interns
GET /api/dtr?user={internId}

# Approve DTR for assigned intern
POST /api/dtr/:id/approve
{ remarks: "Approved" }

# View team performance
GET /api/reports/team/{supervisorId}/performance
```

### Intern Endpoints

```bash
# Get own assigned tasks
GET /api/tasks/assigned-to-me

# Record own time
POST /api/dtr
{ date, time_in, time_out }

# Update own DTR
PATCH /api/dtr/:id
{ time_out: "17:00" }

# View own profile
GET /api/users/me

# Submit task comment
POST /api/tasks/:id/comments
{ content: "Comment text" }
```

## Personal Data Access

Standard users can access:

```
✅ Own profile information
✅ Own task assignments
✅ Own DTR records
✅ Own notifications
✅ Own activity logs
✅ Department information (if in department)
✅ Other users in same department (visibility only)

❌ Other users' profiles
❌ Other users' DTR records
❌ Other users' notifications
❌ Other departments
❌ System-wide settings
```

## Typical Workflows

### Intern Daily Workflow

1. **Arrive at work**
   - Check notifications
   - View assigned tasks

2. **Record time entry**
   - Click "Record Time In"
   - System logs current time

3. **Work on tasks**
   - Update task status
   - Add comments/questions
   - Receive feedback

4. **End of day**
   - Click "Record Time Out"
   - System logs departure time

5. **Supervisor approval**
   - DTR appears in supervisor's queue
   - Supervisor reviews and approves
   - Intern receives confirmation notification

### Supervisor Weekly Workflow

1. **Review team tasks**
   - Check task progress
   - Identify blockers
   - Update priorities

2. **Manage time records**
   - Review pending DTR entries
   - Approve/request corrections
   - Track attendance

3. **Provide feedback**
   - Review completed tasks
   - Add performance feedback
   - Recognize achievements

4. **Report to head**
   - Summarize team performance
   - Highlight issues/successes
   - Plan upcoming work

### Head Monthly Workflow

1. **Approve DTR backlog**
   - Process any pending approvals
   - Review attendance trends

2. **Review department performance**
   - Analyze completion rates
   - Identify training needs
   - Plan adjustments

3. **Report to admin**
   - Share department metrics
   - Highlight achievements
   - Discuss challenges

## Restrictions

Standard users cannot:

```
❌ Create users
❌ Delete users
❌ Change global roles
❌ Create departments
❌ Delete departments
❌ Access other departments
❌ View system-wide activity logs
❌ Change system settings
❌ Approve DTR outside their scope
❌ View other users' profiles
❌ Access other users' DTR
```

## Best Practices

1. **Keep personal data updated** - Profile information should be current
2. **Record time accurately** - DTR should reflect actual hours
3. **Complete assigned tasks** - Focus on assigned work
4. **Communicate proactively** - Use task comments for questions
5. **Request help when needed** - Ask supervisor for assistance
6. **Review feedback** - Act on performance feedback

---

**Recommendation**: Return to [Role Overview](./overview)
