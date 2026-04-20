---
title: Development Setup
description: Guide to setting up the development environment
---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MongoDB** 7.x local or Atlas connection
- **Git** 2.40+
- **npm** 9.x or **yarn** 4.x

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/TeamCA.git
cd TeamCA
```

### 2. Install Root Dependencies

```bash
npm install
```

This installs workspace dependencies for all three apps.

### 3. Environment Configuration

Create `.env` files for each service:

#### Backend (.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/teamca
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/teamca

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=1h

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
```

#### Frontend (.env)

```bash
# Backend API
PUBLIC_API_URL=http://localhost:3000/api
PUBLIC_API_WEBSOCKET_URL=http://localhost:3000

# App Config
PUBLIC_APP_NAME=TeamCA
PUBLIC_ENVIRONMENT=development
```

#### Website (.env)

```bash
# Not required for local development
PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Database Setup

#### MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Request access and collaborator link from Head FSD (Currently Jorell).
3. Review collections and schema.

### 5. Start Services

#### Terminal 1: Backend

```bash
cd backend
npm run dev

# Output:
# ✓ Connected to MongoDB
# ✓ Server running on port 3000
# ✓ Socket.io initialized
```

#### Terminal 2: Frontend

```bash
cd frontend
npm run dev

# Output:
# ✓ ready in 123ms
# ➜  Local:   http://localhost:4321/
```

#### Terminal 3: Website (optional)

```bash
cd website
npm run dev

# Output:
# ✓ ready in 100ms
# ➜  Local:   http://localhost:3000/
```

## Verification

### Backend Health Check

```bash
curl http://localhost:3000/api/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2024-04-20T10:30:00Z"
# }
```

### Frontend

Open http://localhost:4321 in browser

```
✓ Login page loads
✓ Can see login form
✓ No console errors
```

### Database

```bash
# Connect to MongoDB
mongosh
use teamca
db.users.find()

# Should return empty array initially: []
```

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/task-comments
   ```

2. **Backend: Add model**
   ```bash
   # Edit: src/models/TaskComment.ts
   # Add comment schema
   ```

3. **Backend: Add service**
   ```bash
   # Edit: src/services/taskService.ts
   # Add addComment() method
   ```

4. **Backend: Add controller endpoint**
   ```bash
   # Edit: src/controllers/taskController.ts
   # Add route handler
   ```

5. **Backend: Add routes**
   ```bash
   # Edit: src/routes/taskRoutes.ts
   # Add POST /tasks/:id/comments
   ```

6. **Frontend: Create component**
   ```bash
   # Create: src/components/widgets/CommentForm.tsx
   # Add form UI
   ```

7. **Frontend: Add store**
   ```bash
   # Update: src/store/taskStore.ts
   # Add comment state
   ```

8. **Frontend: Integrate**
   ```bash
   # Update: src/features/tasks/TaskDetail.tsx
   # Add CommentForm component
   ```

9. **Test locally**
   ```bash
   # Open frontend, navigate to task
   # Test adding comment
   # Check console for errors
   # Verify API call in network tab
   ```

10. **Commit and push**
    ```bash
    git add .
    git commit -m "feat: add task comments"
    git push origin feature/task-comments
    ```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test

# End-to-end tests (if configured)
npm run test:e2e
```

### Code Quality

```bash
# Lint TypeScript
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Useful Development Commands

### Database

```bash
# Reset database (⚠️ CAUTION: deletes all data)
mongosh
use teamca
db.dropDatabase()

# Seed initial data
node scripts/seed.js

# Backup database
mongodump --uri="mongodb://localhost:27017/teamca" --out=./backup

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/teamca" ./backup/teamca
```

### API Testing

```bash
# Using curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'

# Using httpie (install: brew install httpie)
http POST localhost:3000/api/auth/login \
  email=test@example.com password=pass

# Using Postman
# - Import: https://www.postman.com/teamca/workspace/
# - Or create requests manually
```

### Frontend Debugging

```javascript
// In browser console
// Access Zustand stores
import useAuthStore from '/src/store/authStore.js';
const store = useAuthStore.getState();
console.log(store.user);
console.log(store.token);

// Test API
const api = await import('/src/services/api.ts');
await api.default.get('/users');
```

### WebSocket Debugging

```javascript
// In browser console
const socket = window.__SOCKET__;  // If exposed
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('task-updated', (data) => console.log('Task updated:', data));
```

## Common Issues

### Port Already in Use

```bash
# Backend (port 3000)
lsof -i :3000
kill -9 <PID>

# Frontend (port 4321)
lsof -i :4321
kill -9 <PID>

# Or change ports in config
```

### CORS Errors

```bash
# Verify CORS_ORIGINS in .env includes frontend URL
CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321

# Restart backend after changing
```

### JWT Errors

```bash
# Clear localStorage
localStorage.clear()

# Re-login to get new token
```

## Next Steps

- [Deploy to Production](./deployment)
- [Best Practices](./best-practices)
- [API Documentation](../api/overview)
- [Backend Architecture](../backend/overview)

---

**Goodluck, TeamCA Devs! From one coder to another. ^^**
