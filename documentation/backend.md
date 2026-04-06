backend/
├─ .env
├─ .gitignore
├─ package-lock.json
├─ package.json
├─ tsconfig.json
└─ src/
├─ index.ts
├─ config/
│ └─ db.ts
├─ controllers/
│ ├─ authController.ts
│ ├─ departmentController.ts
│ ├─ dtrController.ts
│ ├─ internProfileController.ts
│ ├─ taskController.ts
│ └─ userController.ts
├─ middlewares/
│ ├─ auth.ts
│ ├─ authMiddleware.ts
│ └─ rbac.ts
├─ models/
│ ├─ Department.ts
│ ├─ DTR.ts
│ ├─ InternProfile.ts
│ ├─ Task.ts
│ ├─ User.ts
│ └─ Whitelist.ts
├─ routes/
│ ├─ authRoutes.ts
│ ├─ departmentRoutes.ts
│ ├─ dtrRoutes.ts
│ ├─ index.ts
│ ├─ internProfileRoutes.ts
│ ├─ taskRoutes.ts
│ └─ userRoutes.ts
├─ services/
│ ├─ authService.ts
│ ├─ departmentService.ts
│ ├─ internProfileService.ts
│ └─ userService.ts
├─ types/
│ └─ express.d.ts
└─ utils/
