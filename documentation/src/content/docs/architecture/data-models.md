---
title: Data Models & Relationships
description: Core data models and database schema
---

## Core Entities

### User

Represents a system user with global and department-specific roles.

```typescript
{
  _id: ObjectId
  first_name: string
  last_name: string
  email: string (unique)
  password_hash: string
  global_role: "Superadmin" | "Admin" | "Standard_User"
  departments: [
    {
      department_id: ObjectId (ref: Department)
      department_role: "Head" | "Supervisor" | "Intern"
    }
  ]
  is_active: boolean
  working_days?: [string]  // e.g., ["Monday", "Tuesday", ...]
  working_hours?: {
    start: string  // e.g., "08:00"
    end: string    // e.g., "17:00"
  }
  createdAt: Date
  updatedAt: Date
}
```

**Key Relationships**:
- Can belong to multiple departments with different roles
- Can create tasks, DTR records, comments
- Can receive notifications
- Activity logs track user actions

---

### Department

Organizational unit grouping users and tasks.

```typescript
{
  _id: ObjectId
  name: string (unique)
  description?: string
  head_id?: ObjectId (ref: User)
  is_active: boolean
  created_at: Date
  updated_at: Date
}
```

**Key Relationships**:
- Has multiple users (through User.departments)
- Scopes tasks and DTR records to department
- Department Head has elevated permissions

---

### Task

Core task management entity.

```typescript
{
  _id: ObjectId
  title: string
  description?: string
  created_by: ObjectId (ref: User)
  status: "Not Started" | "In Progress" | "Under Review" | "Completed"
  priority: "Low" | "Medium" | "High"
  deadline?: Date
  created_at: Date
  updated_at?: Date
}
```

**Related Entities**:
- **TaskAssignment**: Links tasks to assignees
- **TaskComment**: Feedback and discussions from general users
- **TaskFeedback**: Performance feedback on completed tasks by Heads or Supervisor (important notes)
- **TaskStatusHistory**: Audit trail of status changes
- **TaskWorkLink**: Links tasks to work/project artifacts

---

### TaskAssignment

Tracks task assignments and ownership.

```typescript
{
  _id: ObjectId
  task_id: ObjectId (ref: Task)
  assigned_to: ObjectId (ref: User)
  assigned_by: ObjectId (ref: User)
  assigned_at: Date
  completed_at?: Date
  status: "Pending" | "In Progress" | "Completed" | "Rejected"
}
```

---

### DTR (Daily Time Record)

Tracks intern work hours and attendance.

```typescript
{
  _id: ObjectId
  user_id: ObjectId (ref: User)
  department_id: ObjectId (ref: Department)
  date: Date
  time_in: Date
  time_out?: Date
  hours_worked?: number
  status: "Present" | "Absent" | "Late" | "Pending Approval"
  remarks?: string
  approved_by?: ObjectId (ref: User)
  approved_at?: Date
  created_at: Date
  updated_at: Date
}
```

---

### InternProfile

Extended profile for interns.

```typescript
{
  _id: ObjectId
  user_id: ObjectId (ref: User, unique)
  department_id: ObjectId (ref: Department)
  school: string
  course: string
  level?: string
  contact_person?: string
  contact_phone?: string
  school_email?: string
  personal_email?: string
  address?: string
  start_date?: Date
  end_date?: Date
  status: "Active" | "Completed" | "On Leave" | "Terminated"
  created_at: Date
  updated_at: Date
}
```

---

### Notification

Real-time alerts for system events.

```typescript
{
  _id: ObjectId
  recipient_id: ObjectId (ref: User)
  type: "task_assigned" | "task_status_change" | "dtr_approved" | "feedback_received" | "comment_added"
  title: string
  message: string
  related_entity_id?: ObjectId  // Task, DTR, etc.
  is_read: boolean
  created_at: Date
  expires_at?: Date
}
```

---

### ActivityLog

Audit trail of system actions.

```typescript
{
  _id: ObjectId
  user_id: ObjectId (ref: User)
  action: string  // "create_task", "update_task", "approve_dtr", etc.
  entity_type: string  // "Task", "DTR", "User", etc.
  entity_id: ObjectId
  old_values?: object
  new_values?: object
  ip_address?: string
  user_agent?: string
  created_at: Date
}
```

---

### TaskComment

Comments and discussions on tasks.

```typescript
{
  _id: ObjectId
  task_id: ObjectId (ref: Task)
  author_id: ObjectId (ref: User)
  content: string
  created_at: Date
  updated_at?: Date
  is_deleted: boolean
}
```

---

### TaskFeedback

Performance feedback on completed tasks.

```typescript
{
  _id: ObjectId
  task_id: ObjectId (ref: Task)
  given_by: ObjectId (ref: User)
  given_to: ObjectId (ref: User)
  rating: number (1-5)
  comments?: string
  created_at: Date
  updated_at?: Date
}
```

---

### TaskStatusHistory

Audit trail for task status changes.

```typescript
{
  _id: ObjectId
  task_id: ObjectId (ref: Task)
  previous_status: string
  new_status: string
  changed_by: ObjectId (ref: User)
  changed_at: Date
  remarks?: string
}
```

---

### TaskWorkLink

Links tasks to external work/project references.

```typescript
{
  _id: ObjectId
  task_id: ObjectId (ref: Task)
  work_reference: string  // URL, ticket ID, etc.
  description?: string
  created_at: Date
}
```

---

### Whitelist

Security allowlist for login attempts.

```typescript
{
  _id: ObjectId
  email: string
  created_at: Date
  expires_at?: Date
}
```

---

## Entity Relationships Diagram

```
User (1) ───────────────┐
                        │
         ┌──────────────┤
         │              │
    (N) Department    (N) Task
         │              │
         ├──────────────┤
         │              │
      DTR (N)    ┌──────┴─────┐
                 │            │
           TaskAssignment  TaskComment
                 │            │
           TaskFeedback   TaskStatusHistory
                         TaskWorkLink

Notification ────────────→ User (recipient)
           └──────────────→ Related Entity (task, dtr, etc.)

ActivityLog ─────────────→ User
          └──────────────→ Entity (any entity being logged)

InternProfile ──────────→ User
```

---

## Cardinality Summary

| Relationship | Cardinality | Notes |
|---|---|---|
| User ↔ Department | N:M | Through User.departments array |
| User → Task | 1:N | User creates tasks |
| Task → TaskAssignment | 1:N | One task, multiple assignees |
| User → TaskAssignment | 1:N | User can have multiple assignments |
| Task → DTR | N:N | Tasks span multiple days |
| User → DTR | 1:N | One user, many time records |
| Department → DTR | 1:N | DTRs scoped by department |
| User → InternProfile | 1:1 | One user, one profile |
| Task → TaskComment | 1:N | Comments on tasks |
| Task → TaskFeedback | 1:N | Feedback from multiple users |
| Task → TaskStatusHistory | 1:N | Status change history |
| Task → TaskWorkLink | 1:N | Multiple work references |
| User → Notification | 1:N | Users receive many notifications |

---

**Recommendation**: Learn about [Backend Implementation](../backend/overview.md)
