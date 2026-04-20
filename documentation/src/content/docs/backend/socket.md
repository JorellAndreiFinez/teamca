---
title: Real-time (Socket.io)
description: WebSocket implementation for real-time communication
---

WebSocket support for real-time notifications, updates, and collaborative features.

**Location**: `src/socket/io.ts`

## Overview

Socket.io provides bidirectional communication between client and server for instant updates without polling.

## Socket Server Setup

### Initialization

The Socket.io server is configured in `src/socket/io.ts`:

```typescript
import { Server as SocketServer } from 'socket.io';
import { authMiddleware } from '../middlewares/authMiddleware';

export const setupSocketIO = (httpServer: any) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  io.use(authMiddleware);
  return io;
};
```

## Real-time Features

### Notifications
- Task assignments
- Status updates
- Comments and feedback

### Live Updates
- Activity logs
- Department updates
- User presence

### Broadcasting

Socket events are broadcast to relevant clients:

```typescript
// Notify all users in a department
io.to(`dept-${deptId}`).emit('task-created', taskData);

// Notify specific user
io.to(userId).emit('notification', notificationData);
```

## Event Handling

Common Socket.io events implemented:

- `task-assigned` - New task assignment
- `task-updated` - Task status change
- `comment-added` - New comment on task
- `user-online` - User comes online
- `user-offline` - User goes offline


```typescript
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export const initTaskSocket = (server: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user_id = payload.user_id;
      socket.data.email = payload.email;
      socket.data.role = payload.global_role;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection handling
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.user_id}`);
    
    // Join user to personal room
    socket.join(`user:${socket.data.user_id}`);
    
    // Join to department room
    socket.join(`dept:${socket.data.department_id}`);
    
    // Handle events...
  });

  return io;
};
```

## Connection Lifecycle

### Client Connects

```
1. Client: new Socket("http://server", { 
     auth: { token: JWT }
   })

2. Server: Socket.io middleware verifies JWT

3. Server: io.on("connection", ...) fires

4. Client: Emits initial presence event

5. Server & Client: Ready for bidirectional communication
```

### Client Disconnects

```
1. Client disconnect (network loss, tab close, etc.)

2. Server: socket.on("disconnect") fires

3. Server: Cleanup (leave rooms, remove from active users)

4. Client reconnects with same or new connection
```

## Events

### Real-time Event Types

#### Task Updates

```typescript
// Server emits to task watchers
io.to(`task:${taskId}`).emit("task-updated", {
  taskId,
  title,
  status,
  priority,
  updatedAt,
  updatedBy: userId
});

// Client listens
socket.on("task-updated", (data) => {
  store.updateTask(data);
  showNotification(`Task "${data.title}" updated`);
});
```

#### Notifications

```typescript
// Server emits to specific user
io.to(`user:${userId}`).emit("notification-received", {
  _id: notificationId,
  type: "task_assigned",
  title: "New Task",
  message: "You have been assigned a task",
  createdAt: Date.now()
});

// Client displays notification
socket.on("notification-received", (notification) => {
  store.addNotification(notification);
  playNotificationSound();
});
```

#### DTR Approval

```typescript
// When DTR approved by supervisor
io.to(`user:${internId}`).emit("dtr-approved", {
  dtrId,
  date,
  hoursWorked,
  approvedBy: supervisorName,
  approvedAt: Date.now()
});
```

#### Comments

```typescript
// When comment added to task
io.to(`task:${taskId}`).emit("comment-added", {
  commentId,
  taskId,
  author: {
    name: authorName,
    avatar: authorAvatar
  },
  content,
  createdAt: Date.now()
});

// Also notify task watchers
io.to(`task:${taskId}`).emit("task-activity", {
  type: "comment",
  message: `${authorName} commented on this task`
});
```

### Room Management

#### Join Rooms

```typescript
socket.on("join-task", (taskId) => {
  // Verify user has access to task
  const hasAccess = await checkTaskAccess(socket.data.user_id, taskId);
  
  if (hasAccess) {
    socket.join(`task:${taskId}`);
  } else {
    socket.emit("error", { message: "Cannot access task" });
  }
});

socket.on("join-department", (deptId) => {
  const hasAccess = await checkDeptAccess(socket.data.user_id, deptId);
  
  if (hasAccess) {
    socket.join(`dept:${deptId}`);
  }
});
```

#### Leave Rooms

```typescript
socket.on("leave-task", (taskId) => {
  socket.leave(`task:${taskId}`);
});

socket.on("disconnect", () => {
  // Automatically leaves all rooms
  console.log(`User ${socket.data.user_id} disconnected`);
});
```

## Broadcasting Patterns

### Send to Specific User

```typescript
// Notify one user
io.to(`user:${userId}`).emit("event-name", data);
```

### Send to Department

```typescript
// Notify all users in department
io.to(`dept:${departmentId}`).emit("event-name", data);
```

### Send to Task Watchers

```typescript
// Notify all users watching task
io.to(`task:${taskId}`).emit("event-name", data);
```

### Broadcast to All

```typescript
// System-wide announcement
io.emit("system-event", data);
```

### Broadcast Excluding Sender

```typescript
// Send to all except sender
socket.broadcast.emit("event-name", data);
```

## Integration with Services

Services emit socket events when data changes:

```typescript
// In taskService
async updateTask(taskId: string, updates: object) {
  const task = await Task.findByIdAndUpdate(taskId, updates);
  
  // Broadcast update to all watching this task
  io.to(`task:${taskId}`).emit("task-updated", {
    id: task._id,
    ...updates
  });
  
  // Notify assignees
  await notificationService.notifyAssignees(task);
  
  return task;
}

// In notificationService
async createNotification(data: NotificationData) {
  const notification = await Notification.create(data);
  
  // Send real-time notification
  io.to(`user:${data.recipient_id}`).emit("notification-received", {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message
  });
  
  return notification;
}
```

## Frontend Socket Client

### Connection

```typescript
// In React/Astro app
import io from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: localStorage.getItem("jwt")
  }
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
```

### Listening to Events

```typescript
// In component
useEffect(() => {
  socket.on("task-updated", handleTaskUpdate);
  socket.on("notification-received", handleNotification);
  
  return () => {
    socket.off("task-updated", handleTaskUpdate);
    socket.off("notification-received", handleNotification);
  };
}, []);

const handleTaskUpdate = (data) => {
  setTask(prev => ({ ...prev, ...data }));
};

const handleNotification = (notification) => {
  setNotifications(prev => [notification, ...prev]);
};
```

### Joining Rooms

```typescript
// When user opens task details
const viewTask = (taskId) => {
  socket.emit("join-task", taskId);
};

// When user opens department
const viewDepartment = (deptId) => {
  socket.emit("join-department", deptId);
};
```

### Emitting Events

```typescript
// Client can emit to server
socket.emit("user-action", {
  action: "viewing-task",
  taskId: "507f1f77bcf86cd799439013"
});

// Server receives and can broadcast
socket.on("user-action", (data) => {
  io.to(`task:${data.taskId}`).emit("user-viewing-task", {
    userId: socket.data.user_id,
    userName: socket.data.email
  });
});
```

## Socket State Management (Zustand)

```typescript
// Store for real-time data
const useRealtimeStore = create((set) => ({
  activeUsers: [],
  taskUpdates: {},
  notifications: [],
  
  addActiveUser: (user) => set((state) => ({
    activeUsers: [...state.activeUsers, user]
  })),
  
  updateTask: (taskUpdate) => set((state) => ({
    taskUpdates: { ...state.taskUpdates, [taskUpdate.taskId]: taskUpdate }
  })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications]
  }))
}));

// Connect socket to store
useEffect(() => {
  socket.on("task-updated", (data) => {
    useRealtimeStore.getState().updateTask(data);
  });
}, []);
```

## Performance Considerations

### 1. Room-Based Filtering

Always use rooms to avoid unnecessary broadcasts:

```typescript
// Good: Only users in department receive
io.to(`dept:${deptId}`).emit("event", data);

// Bad: Everyone receives, app filters
io.emit("event", { ...data, deptId });
```

### 2. Payload Size

Keep socket messages small:

```typescript
// Good: Minimal data
io.to(`task:${taskId}`).emit("task-updated", {
  taskId,
  status: "In Progress",
  updatedAt: Date.now()
});

// Bad: Entire object
io.to(`task:${taskId}`).emit("task-updated", entireTaskObject);
```

### 3. Connection Pooling

For multi-server deployments, use Redis adapter:

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## Error Handling

```typescript
socket.on("error", (error) => {
  console.error("Socket error:", error);
  // Attempt reconnection
  setTimeout(() => socket.connect(), 1000);
});

// In event handlers
socket.on("event-name", (data, callback) => {
  try {
    // Process
    callback({ success: true, data });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});
```

---

**Recommendation**: Read about [API Reference](../api/overview.md) or explore [Modules](../modules/overview.md)
