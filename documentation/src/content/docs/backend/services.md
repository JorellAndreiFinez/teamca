---
title: Services
description: Business logic and data access layer
---

Services encapsulate business logic, validation, and data transformation. They're called by controllers and orchestrate operations across models.

## Auth Service

Handles authentication logic including login, token generation, and validation.

**Location**: `src/services/authService.ts`

**Key Methods**:

```typescript
authenticate(email: string, password: string): Promise<{
  user: IUser,
  token: string,
  expires_in: number
}>
```
- Finds user by email
- Compares password with bcrypt hash
- Generates JWT token
- Returns user and token
- Throws if credentials invalid

```typescript
validateToken(token: string): Promise<TokenPayload>
```
- Verifies JWT signature
- Checks expiration
- Returns decoded payload
- Throws if invalid or expired

```typescript
hashPassword(plainPassword: string): Promise<string>
```
- Generates bcryptjs hash
- Returns salted hash for storage

**Example Usage**:
```typescript
// In authController
try {
  const result = await authService.authenticate(email, password);
  res.json({
    token: result.token,
    user: result.user,
    expires_in: result.expires_in
  });
} catch (error) {
  res.status(401).json({ message: "Invalid credentials" });
}
```

---

## User Service

Manages user CRUD operations and user-related business logic.

**Location**: `src/services/userService.ts`

**Key Methods**:

```typescript
createUser(userData: {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  global_role: GlobalRole,
  departments: IUserDepartment[]
}): Promise<IUser>
```
- Validates email format and uniqueness
- Hashes password
- Creates user document
- Initializes empty activity log
- Returns created user

```typescript
getUserById(userId: string): Promise<IUser | null>
```
- Queries User model by ID
- Populates department references
- Handles not found

```typescript
listUsers(filter?: object, page = 1, limit = 20): Promise<{
  users: IUser[],
  total: number
}>
```
- Supports filtering by role, department, active status
- Implements pagination
- Returns paginated results

```typescript
updateUser(userId: string, updates: Partial<IUser>): Promise<IUser>
```
- Validates allowed fields
- Prevents role escalation if not authorized
- Updates document
- Logs activity
- Returns updated user

```typescript
deleteUser(userId: string): Promise<void>
```
- Soft delete (sets is_active: false)
- Preserves historical records
- Cascades to related documents

---

## Task Service

Handles task creation, updates, and complex task-related operations.

**Location**: `src/services/taskService.ts`

**Key Methods**:

```typescript
createTask(taskData: {
  title: string,
  description?: string,
  priority: TaskPriority,
  deadline?: Date,
  assignees?: string[]
}, creatorId: string): Promise<ITask>
```
- Validates title and required fields
- Creates Task document
- Creates TaskAssignment records for assignees
- Emits socket event to notify assignees
- Sends notifications to assigned users
- Returns created task with full details

```typescript
updateTask(taskId: string, updates: Partial<ITask>, userId: string): Promise<ITask>
```
- Verifies user owns task or is admin
- Applies updates
- Creates TaskStatusHistory if status changed
- Emits socket event
- Returns updated task

```typescript
changeStatus(taskId: string, newStatus: TaskStatus, userId: string): Promise<void>
```
- Validates status transition
- Records status change with user who made change
- Triggers notifications to interested parties
- Broadcasts via socket

```typescript
listTasks(filter?: {
  status?: TaskStatus,
  createdBy?: string,
  assignedTo?: string,
  department?: string
}, page = 1): Promise<{ tasks: ITask[], total: number }>
```
- Filters tasks based on permissions
- Standard users see only own tasks
- Supervisors see department tasks
- Admins see all
- Includes assignee details

```typescript
addComment(taskId: string, content: string, authorId: string): Promise<TaskComment>
```
- Creates TaskComment document
- Notifies task creator and other commenters
- Emits socket event
- Returns comment

```typescript
addFeedback(taskId: string, rating: number, comments: string, giverId: string): Promise<TaskFeedback>
```
- Validates rating (1-5)
- Creates feedback record
- Notifies recipient
- Returns feedback

---

## Department Service

Manages department operations and organization.

**Location**: `src/services/departmentService.ts`

**Key Methods**:

```typescript
createDepartment(data: {
  name: string,
  description?: string,
  head_id?: string
}): Promise<IDepartment>
```
- Validates unique name
- Sets initial head if provided
- Creates Department document
- Returns created dept

```typescript
listDepartments(filter?: object, page = 1): Promise<{ departments: IDepartment[], total: number }>
```
- Lists all active departments
- Includes member count
- Supports filtering
- Returns paginated results

```typescript
getDepartmentMembers(deptId: string): Promise<{
  department: IDepartment,
  members: Array<{ user: IUser, role: string }>
}>
```
- Gets all users in department
- Returns with their department roles
- Useful for roster views

```typescript
updateDepartment(deptId: string, updates: Partial<IDepartment>): Promise<IDepartment>
```
- Updates department details
- Prevents removing head if has intern assignments
- Returns updated dept

```typescript
addMember(deptId: string, userId: string, role: DepartmentRole): Promise<void>
```
- Adds user to department with role
- Validates user exists
- Updates User.departments array
- Notifies user

```typescript
removeMember(deptId: string, userId: string): Promise<void>
```
- Removes user from department
- Handles cascading (e.g., task reassignment)
- Notifies affected users

---

## Intern Profile Service

Manages intern-specific profile data.

**Location**: `src/services/internProfileService.ts`

**Key Methods**:

```typescript
createProfile(data: {
  user_id: string,
  school: string,
  course: string,
  level?: string,
  contact_person?: string,
  contact_phone?: string,
  start_date?: Date,
  end_date?: Date
}): Promise<IInternProfile>
```
- Creates InternProfile linked to user
- Validates user is Standard_User
- Sets initial status to "Active"
- Returns created profile

```typescript
updateProfile(profileId: string, updates: Partial<IInternProfile>): Promise<IInternProfile>
```
- Updates profile information
- Allows supervisor/dept head edits
- Returns updated profile

```typescript
changeStatus(profileId: string, newStatus: ProfileStatus): Promise<IInternProfile>
```
- Changes intern status (Active, Completed, Terminated, etc.)
- Triggers cascading effects (task reassignment, notifications)
- Returns updated profile

```typescript
listProfiles(filter?: {
  departmentId?: string,
  status?: string,
  school?: string
}, page = 1): Promise<{ profiles: IInternProfile[], total: number }>
```
- Lists intern profiles
- Filters by department, status, school
- Returns paginated results

```typescript
getProfileStats(deptId?: string): Promise<{
  total_interns: number,
  active: number,
  completed: number,
  terminated: number,
  on_leave: number
}>
```
- Returns statistics
- Dept-specific or system-wide

---

## Notification Service

Manages notification creation and delivery.

**Location**: `src/services/notificationService.ts`

**Key Methods**:

```typescript
createNotification(data: {
  recipient_id: string,
  type: NotificationType,
  title: string,
  message: string,
  related_entity_id?: string
}): Promise<INotification>
```
- Creates notification document
- Emits socket event to recipient
- Returns notification

```typescript
notifyUser(userId: string, notification: NotificationData): Promise<void>
```
- Creates and sends notification
- Handles socket emission
- Logs if emission fails but notification exists

```typescript
notifyGroup(userIds: string[], notification: NotificationData): Promise<void>
```
- Creates same notification for multiple users
- Broadcasts via socket to each
- Batch creates for efficiency

```typescript
markAsRead(notificationId: string): Promise<INotification>
```
- Sets is_read: true
- Updates timestamp
- Returns notification

```typescript
markAllAsRead(userId: string): Promise<void>
```
- Marks all user notifications as read
- Used when user opens notification center

```typescript
listNotifications(userId: string, filter?: {
  unread?: boolean,
  type?: string
}, page = 1): Promise<{ notifications: INotification[], total: number }>
```
- Lists user notifications
- Supports filtering
- Returns paginated with unread count

---

## Activity Service

Manages activity logging and audit trails.

**Location**: `src/services/activityService.ts`

**Key Methods**:

```typescript
logActivity(data: {
  user_id: string,
  action: string,
  entity_type: string,
  entity_id: string,
  old_values?: object,
  new_values?: object,
  ip_address?: string,
  user_agent?: string
}): Promise<IActivityLog>
```
- Creates ActivityLog document
- Captures before/after values
- Stores request metadata
- Returns log entry

```typescript
logAction(userId: string, action: string, entityType: string, entityId: string, oldVals?: object, newVals?: object): Promise<void>
```
- Wrapper for common logging
- Used by services to log their operations

```typescript
getActivityLogs(filter?: {
  userId?: string,
  action?: string,
  entityType?: string,
  dateRange?: { start, end }
}, page = 1): Promise<{ logs: IActivityLog[], total: number }>
```
- Lists activity logs
- Admin only access
- Useful for audits
- Returns paginated results

```typescript
getUserActivity(userId: string, page = 1): Promise<{ logs: IActivityLog[], total: number }>
```
- Gets activity by specific user
- Admin only
- Useful for user audit trails

```typescript
getEntityHistory(entityType: string, entityId: string): Promise<IActivityLog[]>
```
- Gets all changes to specific entity
- Shows evolution of record
- Useful for debugging or compliance

---

## Service Patterns

### Error Handling

```typescript
async createTask(data: TaskInput, userId: string) {
  // Validate input
  if (!data.title) {
    throw new Error("Title is required");
  }
  
  // Check preconditions
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  try {
    // Perform operation
    const task = new Task({ ...data, created_by: userId });
    await task.save();
    
    // Side effects
    await notificationService.notifyAssignees(task);
    await activityService.logAction(userId, "create_task", "Task", task._id);
    
    return task;
  } catch (dbError) {
    throw new Error(`Failed to create task: ${dbError.message}`);
  }
}
```

### Pagination Pattern

```typescript
async listTasks(filter = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const tasks = await Task.find(filter)
    .skip(skip)
    .limit(limit)
    .populate("created_by", "first_name last_name email");
  
  const total = await Task.countDocuments(filter);
  
  return { tasks, total, page, limit };
}
```

### Transaction Pattern

```typescript
async updateTaskWithHistory(taskId: string, updates: object) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const task = await Task.findByIdAndUpdate(taskId, updates, { session });
    
    // Create history record in same transaction
    const history = await TaskStatusHistory.create([{
      task_id: taskId,
      previous_status: task.status,
      new_status: updates.status
    }], { session });
    
    await session.commitTransaction();
    return { task, history };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

**Recommendation**: Learn about [Models & Validation](./models)
