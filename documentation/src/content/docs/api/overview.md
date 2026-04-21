---
title: API Overview
description: REST API endpoints and documentation
---

## Base URL

```
http://localhost:3000/api    (development)
https://api.example.com/api  (production)
```

## Authentication

All API requests require JWT token in Authorization header:

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  https://api.example.com/api/users
```

**Obtain token**:
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "expires_in": 3600
}
```

## Error Responses

All errors follow consistent format:

```json
{
  "status": 400,
  "message": "Error description",
  "timestamp": "2024-04-20T10:30:00Z",
  "path": "/api/tasks",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request processed |
| 201 | Created | Resource created |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Invalid input, check errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal error, retry later |

## API Endpoints

### Authentication
- [POST /auth/login](#) - Login
- [POST /auth/logout](#) - Logout
- [POST /auth/refresh](#) - Refresh token

### Users
- [GET /users](#) - List users
- [GET /users/:id](#) - Get user
- [POST /users](#) - Create user
- [PATCH /users/:id](#) - Update user
- [DELETE /users/:id](#) - Delete user

### Tasks
- [GET /tasks](#) - List tasks
- [GET /tasks/:id](#) - Get task
- [POST /tasks](#) - Create task
- [PATCH /tasks/:id](#) - Update task
- [DELETE /tasks/:id](#) - Delete task
- [POST /tasks/:id/assign](#) - Assign task
- [POST /tasks/:id/comments](#) - Add comment
- [POST /tasks/:id/feedback](#) - Add feedback

### Departments
- [GET /departments](#) - List departments
- [GET /departments/:id](#) - Get department
- [POST /departments](#) - Create department
- [PATCH /departments/:id](#) - Update department

### Notifications
- [GET /notifications](#) - List notifications
- [GET /notifications/:id](#) - Get notification
- [PATCH /notifications/:id/read](#) - Mark as read

### Activity Logs
- [GET /activity-logs](#) - List activity logs

## Pagination

Endpoints that return lists support pagination:

```bash
GET /api/tasks?page=1&limit=20

Response:
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering

Most list endpoints support filtering:

```bash
# Filter by status
GET /api/tasks?status=In%20Progress

# Filter by date range
GET /api/dtr?startDate=2024-04-01&endDate=2024-04-30

# Filter by multiple criteria
GET /api/users?role=Admin&department=507f1f77bcf86cd799439012

# Search
GET /api/tasks?search=login
```

## Sorting

```bash
# Sort ascending
GET /api/tasks?sort=created_at

# Sort descending
GET /api/tasks?sort=-created_at

# Multi-sort
GET /api/tasks?sort=priority,-deadline
```

## Real-time Events

WebSocket events for real-time updates:

### Connection

```typescript
const socket = io("http://localhost:3000", {
  auth: { token: JWT }
});

socket.on("connect", () => {
  console.log("Connected");
});
```

### Events

```typescript
// Task updates
socket.on("task-updated", (data) => { ... });
socket.on("task-created", (data) => { ... });

// Notifications
socket.on("notification-received", (data) => { ... });

// DTR events
socket.on("dtr-approved", (data) => { ... });

// Comments
socket.on("comment-added", (data) => { ... });
```

## Rate Limiting

API enforces rate limiting:

```
Limit: 100 requests per 15 minutes per IP
Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 75
  X-RateLimit-Reset: 1713607200
```

If exceeded:
```
Status: 429 Too Many Requests
{
  "status": 429,
  "message": "Rate limit exceeded. Try again in 15 minutes."
}
```

## CORS

Configured CORS origins:

```
http://localhost:4321      (development)
http://127.0.0.1:4321      (development)
https://example.com        (production)
```

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## Versioning

Current API version: **v1**

Future versions will be at `/api/v2/`, etc.

## Documentation by Module

- **[Auth API](./auth)**
- **[Tasks API](./tasks)**
- **[DTR API](./dtr)**
- **[Users API](./users)**
- **[Departments API](./departments)**
- **[Notifications API](./notifications)**
- **[Activity Logs API](./activity-logs)**

---

**Recommendation**: Explore individual API modules or return to [Backend Architecture](../backend/overview)