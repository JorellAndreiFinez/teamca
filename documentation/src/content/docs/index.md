---
title: Welcome to Documentation Site!
description: Complete documentation for the TeamCA intern management system
---

Hey there! This is the official **TeamCA** documentation hub that contains the comprehensive guide covers the entire system architecture, including backend APIs, frontend applications, and role-based access controls.

## 🦁 What is TeamCA?

TeamCA is a full-stack intern management system designed to streamline task assignment, time tracking, and intern profile management across multiple departments specifically for **TeamCA** under **Black Orcas Summit Life Insurance Agency**. It also includes a client-facing website made for the whole team to show to clients and boost the professional image of the agency as a whole.

## 🏗️ System Overview

The system consists of three main components:

- **Backend** (Express.js + TypeScript + MongoDB): RESTful API with real-time WebSocket support
- **Frontend** (Astro + React): Internal dashboard for system users
- **Website** (Astro): Public-facing informational site for Ms. Ann and possible clients

## 🗂️ Documentation Structure

```
├─ Architecture          # System design & data flows
├─ Backend              # API, controllers, services, models
├─ Frontend             # Dashboard components, features, state
├─ Modules              # Feature-specific documentation
│  ├─ Tasks
│  ├─ DTR (Daily Time Records)
│  ├─ Notifications
│  ├─ Auth
│  └─ More...
├─ Roles                # Permission boundaries by role
├─ API                  # Endpoint reference
└─ Guides               # Implementation patterns & best practices
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies (from project root)
npm i

# Backend
cd backend && npm run dev

# Frontend (in new terminal)
cd frontend && npm run dev

# View documentation
cd documentation && npm run dev
```

### Documentation Build

```bash
cd documentation
npm install
npm run build
```

## 🔐 Key Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Task Management** - Create, assign, and track tasks with status updates
- **Daily Time Records** - Track intern work hours and attendance
- **Real-time Updates** - WebSocket support for live notifications and updates
- **Department Management** - Organize users by departments with hierarchical roles
- **Activity Logging** - Comprehensive audit trail of system actions
- **Multi-role System** - Superadmin, Admin, and Standard_User with department-specific roles

## 🎯 Navigation

Select a section from the menu to dive deeper into specific areas of the system.

---
### Happy viewing!

Feel free to edit the markdowns for future updates. See [Starlight Configs](guides/starlight-config) for more information and content guidelines.

---

**Version**: 1.0.0 | **Last Updated**: April 2026  
**Contributors**: Angelo Bayla, Jorell Andrei Finez
