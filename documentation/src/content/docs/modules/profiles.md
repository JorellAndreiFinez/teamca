---
title: User Profiles & Intern Management
description: User profile management and intern profile tracking system
---

The User Profiles module manages user information, intern-specific details, and personal profile management.

## Overview

**Purpose**: Store and manage user profiles, intern details, and personal information

**Components**:
- User account information
- Intern-specific data (school, major, etc.)
- Department assignments
- Contact information
- Profile photos

## System Architecture

### Backend Flow

```
Profile Update Request
    ↓
profileController / internProfileController
    ↓
profileService / internProfileService
    ↓
User Model / InternProfile Model
    ↓
Database
```

### Key Files

**Backend** | Location
---|---
Intern Profile Controller | `backend/src/controllers/internProfileController.ts`
Intern Profile Service | `backend/src/services/internProfileService.ts`
Intern Profile Model | `backend/src/models/InternProfile.ts`
User Model | `backend/src/models/User.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/profile/`
Components | `frontend/src/features/profile/components/`

## Data Models

### User Schema
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  firstName: string,
  lastName: string,
  globalRole: "SUPERADMIN" | "ADMIN" | "USER",
  departments: [{
    department: ObjectId,
    role: "ADMIN" | "MEMBER"
  }],
  isActive: boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### InternProfile Schema
```typescript
{
  _id: ObjectId,
  user: ObjectId (reference to User),
  school: string,
  major: string,
  year: string (Freshman, Sophomore, etc.),
  startDate: Date,
  endDate: Date,
  phoneNumber: string,
  address: string,
  profilePhoto: string (URL),
  bio: string,
  skills: string[],
  mentor: ObjectId (assigned supervisor),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Implementation

### Components
```
features/profile/
├── components/
│   ├── ProfileCard.tsx
│   ├── ProfileForm.tsx
│   ├── InternProfileForm.tsx
│   ├── ProfilePhoto.tsx
│   └── ContactInfo.tsx
├── pages/
│   ├── ProfilePage.astro
│   └── InternProfilePage.astro
└── store/
    └── profileStore.ts
```

### User Flow: Updating Profile

```
User navigates to Profile
    ↓
Current profile data loaded from /api/profile
    ↓
Form displays with current information
    ↓
User edits fields
    ↓
Submits form
    ↓
Frontend validates data
    ↓
PUT /api/profile with updated data
    ↓
Backend validates and updates MongoDB
    ↓
ActivityLog created
    ↓
Frontend shows success message
```

## Access Control

| Action | Superadmin | Admin | User |
|---|---|---|---|
| View own profile | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ |
| View other profiles | ✓ | ✓ (same dept) | ✗ |
| Edit other profiles | ✓ | ✓ (same dept) | ✗ |
| Delete profiles | ✓ | ✗ | ✗ |
| Manage roles | ✓ | ✗ | ✗ |

## Notifications

Profile-related events that generate notifications:
- Role assigned/changed
- Department assignment
- Profile requires attention (incomplete info)
- Mentor assigned/changed

## Recommendations

| Page | Purpose |
|---|---|
| [Authentication Module](/modules/auth) | User account creation |
| [Roles & Access Control](/roles/overview) | User roles and permissions |
| [Activity Logs Module](/modules/activity-logs) | Profile change audit |
