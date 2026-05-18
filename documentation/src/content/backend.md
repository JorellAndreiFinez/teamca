backend/
├── node_modules/
├── src/
│ ├── config/
│ │ └── db.ts
│ ├── controllers/
│ │ ├── authController.ts
│ │ ├── departmentController.ts
│ │ ├── dtrController.ts
│ │ ├── internProfileController.ts
│ │ ├── leaveController.ts
│ │ ├── taskController.ts
│ │ └── userController.ts
│ ├── middlewares/
│ │ ├── auth.ts
│ │ ├── authMiddleware.ts
│ │ └── rbac.ts
│ ├── models/
│ │ ├── Department.ts
│ │ ├── DTR.ts
│ │ ├── InternProfile.ts
│ │ ├── Leave.ts
│ │ ├── Task.ts
│ │ ├── TaskAssignment.ts
│ │ ├── TaskComment.ts
│ │ ├── TaskFeedback.ts
│ │ ├── TaskStatusHistory.ts
│ │ ├── TaskWorkLink.ts
│ │ ├── User.ts
│ │ └── Whitelist.ts
│ ├── routes/
│ │ ├── authRoutes.ts
│ │ ├── departmentRoutes.ts
│ │ ├── dtrRoutes.ts
│ │ ├── index.ts
│ │ ├── internProfileRoutes.ts
│ │ ├── leaveRoutes.ts
│ │ ├── taskRoutes.ts
│ │ └── userRoutes.ts
│ ├── services/
│ │ ├── authService.ts
│ │ ├── departmentService.ts
│ │ ├── dtrService.ts
│ │ ├── internProfileService.ts
│ │ ├── leaveService.ts
│ │ ├── taskService.ts
│ │ └── userService.ts
│ ├── socket/
│ │ └── io.ts
│ ├── types/
│ │ └── express.d.ts
│ ├── utils/
│ └── index.ts
├── .env
├── .gitignore
├── backend-files.txt
├── package-lock.json
├── package.json
└── tsconfig.json
