# Front-end Structure

**For maintenance and documentation purposes only.**  
The initial file tree is as follows:

## Project Structure

```
frontend/
├── .env                          # In .gitignore by default
├── .gitignore
├── astro.config.mjs
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked dependency versions
├── tailwind.config.mjs
├── tsconfig.json
├── README.md                     # Front-end Documentation
├── SETUP.md
│
├── public/
│   └── .gitkeep
│
└── src/
    ├── vite-env.d.ts
    │
    ├── assets/                   # Images, fonts, icons
    │   └── .gitkeep
    │
    ├── components/               # Reusable UI components
    │   ├── ui/                   # Generic elements (ShadCN UI)
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   └── Modal.tsx
    │   └── common/               # Shared complex elements
    │       └── LoadingSpinner.tsx
    │
    ├── config/                   ## App-wide configuration
    │   └── env.ts                # Environment setup
    │
    ├── features/                 # Domain-based modules
    │   ├── auth/                 # Authentication logic
    │   │   ├── LoginForm.tsx
    │   │   └── FirstTimeSetupForm.tsx
    │   ├── dtr/                  # Daily Time Records
    │   │   └── .gitkeep
    │   ├── tasks/                # Task management
    │   │   └── .gitkeep
    │   ├── users/                # User-related
    │   │   └── .gitkeep
    │   └── superadmin/           # Superadmin features
    │       └── WhitelistManager.tsx
    │
    ├── hooks/                    # Custom React hooks
    │   └── useWindowSize.ts
    │
    ├── layouts/                  ## Astro page layouts
    │   ├── AuthLayout.astro      # Login page shell
    │   └── DashboardLayout.astro # Dashboard with sidebar
    │
    ├── pages/                   ## File-based routing (Astro)
    │   ├── index.astro          # Main entry point
    │   ├── login.astro          # Login page
    │   ├── profile.astro        # User profile
    │   ├── dtr.astro            # Daily Time Records
    │   ├── tasks.astro          # Task management
    │   └── superadmin.astro     # Superadmin dashboard
    │
    ├── services/                ## HTTP requests & API
    │   ├── api.ts               # Axios instance with interceptors
    │   ├── authService.ts
    │   ├── dtrService.ts
    │   ├── taskService.ts
    │   └── userService.ts
    │
    ├── store/                   ## Global state (Zustand)
    │   ├── authStore.ts         # JWT token & user data
    │   └── uiStore.ts           # UI states (dark mode, sidebar)
    │
    ├── styles/                  ## Global CSS
    │   └── globals.css
    │
    ├── types/                   ## TypeScript interfaces
    │   ├── auth.ts
    │   ├── dtr.ts
    │   ├── task.ts
    │   └── user.ts
    │
    └── utils/                   ## Helper functions
        ├── dateUtils.ts
        └── validators.ts
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
