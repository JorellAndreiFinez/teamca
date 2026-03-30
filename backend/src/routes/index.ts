// backend\src\routes\index.ts

import { Router } from "express";
import authRoutes from "./authRoutes";
import departmentRoutes from "./departmentRoutes";
import internProfileRoutes from "./internProfileRoutes";
import notificationRoutes from "./notificationRoutes";
import userRoutes from "./userRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/intern-profiles", internProfileRoutes);
router.use("/notifications", notificationRoutes);

export default router;
