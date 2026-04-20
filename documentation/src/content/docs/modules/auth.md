---
title: Authentication & Authorization
description: User authentication, JWT tokens, and access control system
---

The Auth module handles user login, JWT token generation, password management, and role-based access verification.

## Overview

**Purpose**: Securely authenticate users and authorize actions based on roles and permissions

**Key Features**:
- Email/password login
- JWT token generation and verification
- Role-based access control (RBAC)
- Session management
- Password security

## System Architecture

### Backend Flow

```
Login Request (email, password)
    ↓
authController (handles credentials)
    ↓
authService (validates, generates JWT)
    ↓
User Model lookup
    ↓
JWT Token generated + returned
    ↓
Frontend stores token (localStorage/cookie)
```

### Key Files

**Backend** | Location
---|---
Controller | `backend/src/controllers/authController.ts`
Service | `backend/src/services/authService.ts`
Middleware | `backend/src/middlewares/authMiddleware.ts`
Routes | `backend/src/routes/authRoutes.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/auth/`
Components | `frontend/src/features/auth/components/`
Store | `frontend/src/store/`

## Authentication Flow

### Login Process

```
User enters credentials
    ↓
POST /api/auth/login (email, password)
    ↓
Backend queries User model
    ↓
Password verified with bcrypt
    ↓
JWT generated (contains user ID, role, permissions)
    ↓
Token returned to frontend
    ↓
Stored in localStorage/sessionStorage
    ↓
Added to Authorization header for future requests
```

### Token Structure

```
Header: {
  alg: "HS256",
  typ: "JWT"
}

Payload: {
  user_id: ObjectId,
  email: string,
  global_role: "SUPERADMIN" | "ADMIN" | "USER",
  department: ObjectId,
  iat: timestamp,
  exp: timestamp + 7 days
}

Signature: HMAC(header + payload, JWT_SECRET)
```

### Protected Routes

```typescript
// All protected routes require:
Authorization: Bearer <JWT_TOKEN>

// Middleware verifies:
1. Token exists
2. Token not expired
3. Token signature valid
4. User ID still valid in database
```

## Authorization & RBAC

### Role Hierarchy

```
SUPERADMIN
├── Can manage all users
├── Can manage all tasks
├── Can view all reports
└── Can configure system

ADMIN
├── Can manage users in their department
├── Can create/assign tasks
├── Can view department reports
└── Limited configuration

USER
├── Can view assigned tasks
├── Can update own tasks
├── Can view own DTR
└── Can comment on assigned tasks
```

### Permission Checks

Each endpoint verifies:
1. Token validity
2. User exists and active
3. User role has permission
4. Resource belongs to user's department (if applicable)

## Frontend Implementation

### Components
```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── LogoutButton.tsx
│   ├── AuthGuard.tsx
│   └── RoleGuard.tsx
└── store/
    └── authStore.ts (Zustand)
```

### Protected Routes
```typescript
// Frontend checks token before routing
// If token expired, redirect to login
// If role insufficient, show permission error
```

## Password Security

- **Hashed**: bcrypt with 10 rounds
- **Minimum Length**: 8 characters
- **Complexity**: Recommended but not enforced
- **Reset**: Via email link with temporary token

## Session Management

- **Duration**: 7 days
- **Refresh**: Can extend session with valid token
- **Logout**: Token removed from client, blacklisted on server

## Recommendations

| Page | Purpose |
|---|---|
| [Roles & Access Control](/roles/overview) | Permission boundaries |
| [Backend Middlewares](/backend/middlewares) | RBAC implementation |
| [Frontend Components](/frontend/components) | Login/Auth UI |
