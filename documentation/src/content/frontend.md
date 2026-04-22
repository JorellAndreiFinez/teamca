frontend/
├─ .astro/
│ ├─ collections/
│ ├─ content-assets.mjs
│ ├─ content-modules.mjs
│ ├─ content.d.ts
│ ├─ data-store.json
│ ├─ settings.json
│ └─ types.d.ts
├─ public/
│ └─ favicon.ico
├─ src/
│ ├─ components/
│ │ ├─ common/
│ │ │ ├─ LoadingSpinner.tsx
│ │ │ ├─ RouteGuard.tsx
│ │ │ └─ Sidebar.tsx
│ │ ├─ superadmin/
│ │ │ ├─ AddUserModal.tsx
│ │ │ └─ UpdateUserModal.tsx
│ │ ├─ ui/
│ │ │ ├─ Button.tsx
│ │ │ ├─ Card.tsx
│ │ │ ├─ Dialog.tsx
│ │ │ ├─ Input.tsx
│ │ │ └─ Modal.tsx
│ │ └─ widgets/
│ │ ├─ CalendarWidget.tsx
│ │ ├─ DtrAnalyticsWidget.tsx
│ │ ├─ MembersBriefWidget.tsx
│ │ ├─ StatCard.tsx
│ │ └─ TaskBriefWidget.tsx
│ ├─ config/
│ │ └─ env.ts
│ ├─ features/
│ │ ├─ auth/
│ │ │ ├─ FirstTimeSetupForm.tsx
│ │ │ └─ LoginForm.tsx
│ │ ├─ dashboard/
│ │ │ ├─ components/
│ │ │ │ ├─ CalendarWidget.tsx
│ │ │ │ ├─ DTRAnalyticsWidget.tsx
│ │ │ │ └─ TaskBriefWidget.tsx
│ │ │ ├─ AdminDashboard.tsx
│ │ │ ├─ Dashboard.tsx
│ │ │ ├─ DtrPageContent.tsx
│ │ │ ├─ InternDashboard.tsx
│ │ │ ├─ ProfilePageContent.tsx
│ │ │ ├─ RoleDashboard.tsx
│ │ │ ├─ SuperadminDashboard.tsx
│ │ │ └─ TasksPageContent.tsx
│ │ ├─ dtr/
│ │ │ └─ DTRPage.tsx
│ │ ├─ profile/
│ │ │ └─ ProfilePage.tsx
│ │ ├─ superadmin/
│ │ │ ├─ SuperAdmin.tsx
│ │ │ ├─ UserDirectory.tsx
│ │ │ └─ WhitelistManager.tsx
│ │ └─ tasks/
│ │ ├─ components/
│ │ │ ├─ TaskActions.tsx
│ │ │ ├─ TaskComments.tsx
│ │ │ ├─ TaskDetails.tsx
│ │ │ ├─ TaskFilters.tsx
│ │ │ ├─ TaskLinks.tsx
│ │ │ ├─ TaskModal.tsx
│ │ │ ├─ TaskPagination.tsx
│ │ │ ├─ TaskRow.tsx
│ │ │ ├─ TaskTable.tsx
│ │ │ └─ TaskTimeline.tsx
│ │ └─ hooks/
│ │ └─ useTaskSocket.ts
│ ├─ hooks/
│ │ └─ useWindowSize.ts
│ ├─ layouts/
│ │ ├─ AuthLayout.astro
│ │ └─ DashboardLayout.astro
│ ├─ lib/
│ │ ├─ roleRoutes.ts
│ │ └─ utils.ts
│ ├─ pages/
│ │ ├─ dashboard.astro
│ │ ├─ dtr.astro
│ │ ├─ index.astro
│ │ ├─ login.astro
│ │ ├─ profile.astro
│ │ ├─ setup.astro
│ │ ├─ superadmin.astro
│ │ ├─ tasks.astro
│ │ └─ users.astro
│ ├─ services/
│ │ ├─ api.ts
│ │ ├─ authService.ts
│ │ ├─ departmentService.ts
│ │ ├─ dtrService.ts
│ │ ├─ internProfileService.ts
│ │ ├─ taskService.ts
│ │ └─ userService.ts
│ ├─ store/
│ │ ├─ authStore.ts
│ │ └─ uiStore.ts
│ ├─ styles/
│ │ └─ globals.css
│ ├─ types/
│ │ ├─ auth.ts
│ │ ├─ axios.d.ts
│ │ ├─ dtr.ts
│ │ ├─ task.ts
│ │ └─ user.ts
│ └─ utils/
│ ├─ dateUtils.ts
│ └─ validators.ts
├─ .env
├─ .gitignore
├─ astro.config.mjs
├─ components.json
├─ package-lock.json
├─ package.json
├─ STRUCTURE.md
├─ tailwind.config.mjs
└─ tsconfig.json
