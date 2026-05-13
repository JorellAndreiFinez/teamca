---
title: DTR (Daily Time Records) Module
description: Complete guide to Daily Time Record tracking for interns
---

The DTR module tracks daily working hours, attendance, and time-based analytics for interns across the organization.

## Overview

**Purpose**: Record and track daily work hours, manage attendance, and generate time reports

**Who can access?**
- **Interns**: Log time, view own DTR
- **Admin**: View department DTR, generate reports
- **Superadmin**: View all DTR records, system-wide reports

## System Architecture

### Backend Flow

```
User Request
    ↓
dtrController (HTTP handler)
    ↓
dtrService (business logic)
    ↓
DTR Model (MongoDB schema)
    ↓
Database
```

### Key Files

**Backend** | Location
---|---
Controller | `backend/src/controllers/dtrController.ts`
Service | `backend/src/services/dtrService.ts`
Model | `backend/src/models/DTR.ts`
Routes | `backend/src/routes/dtrRoutes.ts`

**Frontend** | Location
---|---
Feature Folder | `frontend/src/features/dtr/`
Components | `frontend/src/features/dtr/components/`
Store | `frontend/src/store/`

## Core Functionality

### Time Logging
- **Who**: Interns
- **What**: Log start time, end time, notes
- **When**: Daily basis
- **Where**: DTR page in dashboard

### Time Validation
- **Overlap detection**: Prevent double time logging
- **Duration limits**: Ensure reasonable work hours
- **Timestamp verification**: Server-side validation

### Reporting
- **By User**: Individual time reports
- **By Department**: Aggregate hours per department
- **By Date Range**: Flexible date filtering
- **Export**: Generate CSV reports

## Data Model

### DTR Schema
```typescript
{
  _id: ObjectId
  user: ObjectId (reference to User)
  date: Date
  timeIn: Date
  timeOut: Date
  hoursWorked: number
  notes: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

## Frontend Implementation

### Components
```
features/dtr/
├── components/
│   ├── DTRForm.tsx
│   ├── DTRList.tsx
│   ├── DTRReport.tsx
│   └── TimeTracker.tsx
├── pages/
│   └── DTRPage.astro
└── store/
    └── dtrStore.ts
```

### User Flow: Logging Time

```
Intern opens DTR page
    ↓
Clicks "Log Time"
    ↓
Selects date and enters time in/out
    ↓
Adds optional notes
    ↓
Submits form
    ↓
Frontend validates (not overlapping, reasonable duration)
    ↓
POST /api/dtr with time data
    ↓
Backend validates and saves
    ↓
ActivityLog created
    ↓
Admin notification
```

## Recommendations

| Page | Purpose |
|---|---|
| [Roles & Access Control](/roles/overview) | Understand DTR permissions |
| [Activity Logs Module](/modules/activity-logs) | Track DTR changes |
| [Backend Services](/backend/services) | Service layer details |
