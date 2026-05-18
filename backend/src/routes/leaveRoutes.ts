// backend\src\routes\leaveRoutes.ts

import express from "express";
import * as leaveController from "../controllers/leaveController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, leaveController.createLeave);
router.get("/me", authMiddleware, leaveController.getMyLeaves);

router.patch("/:leaveId/approve", authMiddleware, leaveController.approveLeave);

router.patch("/:leaveId/cancel", authMiddleware, leaveController.cancelLeave);

export default router;
